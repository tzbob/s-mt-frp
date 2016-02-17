package mtfrp.lang

import java.net.URLDecoder
import scala.js.exp.FFIExp
import scala.language.implicitConversions
import scala.language.reflectiveCalls
import scala.language.postfixOps

import akka.actor._
import akka.pattern.ask
import hokko.core.{Behavior, Engine, Event => HEvent, EventSource => HEventSource}
import java.net.URLEncoder
import java.util.UUID
import scala.concurrent.duration._
import scala.virtualization.lms.common.IfThenElse
import scala.virtualization.lms.common.MiscOps
import scala.virtualization.lms.common.StringOps
import spray.can.Http
import spray.http._
import spray.routing._
import spray.routing.Directives._
import spray.routing.RequestContext

import io.circe._
import io.circe.generic.auto._
import io.circe.parser._
import io.circe.syntax._

trait RouteCreatorLib extends ReplicationCoreLib with MiscOps with IfThenElse {

  /**
   * Responsible for creating server routes and client-side logic to
   * make replication between client and server tiers possible
   */
  class RouteCreator(
    core: ReplicationCore,
    serverEngine: Engine,
    clientEngine: Rep[ScalaJs[Engine]],
    clientQueues: Behavior[Map[Client, List[Client => Seq[Message]]]]
  )(implicit actorRef: ActorRefFactory) {
    lazy val serverCarrier = core.serverCarrier
    lazy val serverNamedPulseMakers = core.serverNamedPulseMakers
    lazy val serverNamedInitialsPulseMakers = core.serverNamedPulseMakers

    lazy val clientCarrier = core.clientCarrier

    private val isSseOpen: Var[Boolean] = var_new(unit(false))
    private val clientQueue: Var[List[ScalaJs[Seq[Message]]]] = var_new(List())
    private val lastPromise: Var[Option[XhrPromise]] = var_new(none)

    def makeRoute(): Option[Route] = {
      val r1 =
        if (!core.toClientDeps.isEmpty)
          Some(initializeToClientDependencies())
        else None

      val r2 =
        if (!core.toServerDeps.isEmpty)
          Some(initializeToServerDependencies())
        else None

      r1 match {
        case Some(route1) => r2 match {
          case Some(route2) => Some(route1 ~ route2)
          case None => Some(route1)
        }
        case None => r2 match {
          case Some(route2) => Some(route2)
          case None => None
        }
      }
    }

    /**
     * @return optionally, the Route that encompasses all involved client
     * functionality
     */
    private def initializeToClientDependencies(): Route = {
      val url = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
      initClientSideToClient(url)
      initServerSideToClient(url)
    }

    /**
     * initialize the client section of 'toClient' calls
     *  i.e., listen to the server's updates and push values into the
     *  right EventSource's on the client
     */
    private def initClientSideToClient(url: String): Unit = {
      implicit def messageOps(m: Rep[Message]) = adtOps(m)

      val values = clientEngine.askCurrentValues()
      val initialMessages = ScalaJsRuntime.decodeOptions(values(core.clientInitialCarrier)).getOrElse(List())
      val initialsJson = initialMessages.toJSONString

      val clientUrl: Rep[String] = includeClientIdParam(url)
      val clientUrlWithParam = clientUrl + "&initials="
      val sseSource = EventSource(clientUrlWithParam + encodeURIComponent(initialsJson))

      // attach the SSE Open hook
      sseSource.onOpen(fun { (_: Rep[Open]) =>
        var_assign(isSseOpen, unit(true))
        flushQueue(url)
      })

      def listen(rep: Rep[NamedClientPulseMaker])(evt: String): Unit = {
        sseSource.listen(unit(evt)) {
          fun { (ev: Rep[Dataliteral]) =>
            val messages = implicitly[JSJsonReader[List[Message]]].read(ev.data)
            val pulses = messages.map { (message: Rep[Message]) =>
              rep(message.name)(message.json)
            }
            clientEngine.fire(ScalaJsRuntime.encodeListAsSeq(pulses))
          }
        }
        () // ignore the event source, it will live as long as the client will
      }

      // listen(core.clientNamedResetPulseMakers)("reset")
      listen(core.clientNamedUpdatePulseMakers)("update")
    }

    import HttpHeaders.{`Cache-Control`, `Connection`}
    import CacheDirectives.`no-cache`
    private def respondAsEventStream =
      respondWithHeader(`Cache-Control`(`no-cache`)) &
        respondWithHeader(`Connection`("Keep-Alive")) &
        respondWithMediaType(MediaType.custom("text/event-stream"))

    /**
     * initialize the server section of 'toClient' calls
     *  i.e., subscribe to the serverCarrier and push new values
     *  to the client using server sent events
     */
    private def initServerSideToClient(url: String)(implicit refFactory: ActorRefFactory): Route = {
      path(url) {
        get {
          parameter('id) { id =>
            parameter('initials) { initials =>
              respondAsEventStream { ctx =>
                val client = Client(id)

                class MtFrpActor extends Actor {
                  ctx.responder ! ChunkedResponseStart(
                    HttpResponse(entity = s""": ${" " * 2049}\n""")
                  )

                  def sendMessageChunk(evt: String)(msgsForClient: Client => Seq[Message]) = {
                    val msgs = msgsForClient(client)
                    val data = s"event: $evt\ndata:${msgs.asJson.noSpaces}\n\n"
                    ctx.responder ! MessageChunk(data)
                  }

                  // http://stackoverflow.com/questions/2632175/java-decoding-uri-query-string
                  val decodedInitials = URLDecoder.decode(initials.replace("+", "%2B"), "UTF-8")
                    .replace("%2B", "+")

                  // TODO: Make this safe? Log the errors and ignore wrong formats?
                  val initialData = decode[List[Message]](decodedInitials).toOption.get
                  val pulses = initialData.map { message =>
                    serverNamedInitialsPulseMakers(message.name)(message.json, client)
                  }

                  // Client has connected, ask all current values
                  val values = serverEngine.askCurrentValues()

                  // Send the `reset` data: TODO: this is only useful after a 'reconnect' not after an 'initial' connect
                  // values(core.initialCarrier).foreach(sendMessageChunk("reset"))

                  // Send the queued event pulses
                  values(clientQueues).foreach { clientQueueMap =>
                    val clientQueueOpt = clientQueueMap.get(client)

                    clientQueueOpt.foreach { clientQueue =>
                      // It's a LIFO stack so reverse
                      clientQueue.reverse.foreach(sendMessageChunk("update"))
                    }
                  }

                  // Inform that the client has been connected and send out all the initial data
                  serverEngine.fire(rawClientEventSource -> Connected(client) :: pulses)

                  val subscription = serverEngine.subscribeForPulses { pulses =>
                    pulses(serverCarrier).foreach(sendMessageChunk("update"))
                  }

                  // Keep-Alive
                  context.setReceiveTimeout(15 seconds)

                  def receive = {
                    case Http.Close | Http.ConfirmedClose | Http.Abort | Http.PeerClosed | Http.ErrorClosed =>
                      // Disconnected --> cleanup
                      serverEngine.fire(Seq(rawClientEventSource -> Disconnected(client)))
                      subscription.cancel()
                      context.stop(self)

                    // Comment to keep connection alive
                    case ReceiveTimeout => ctx.responder ! MessageChunk(":\n")
                  }
                }

                refFactory.actorOf(Props(new MtFrpActor))
              }
            }
          }
        }
      }
    }

    /**
     *  @return optionally, the Route that encompasses all involved server
     *  functionality
     */
    private def initializeToServerDependencies(): Route = {
      val url = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
      initClientSideToServer(url)
      initServerSideToServer(url)
    }

    // Queue the events until SSE is open
    private def addToQueue(n: Rep[ScalaJs[Seq[Message]]]): Unit =
      var_assign(clientQueue, n :: readVar(clientQueue))

    private def flushQueue(url: String): Unit =
      readVar(clientQueue).foreach(scheduleNewXhrPromise(url))

    private def scheduleNewXhrPromise(url: String)(seq: Rep[ScalaJs[Seq[Message]]]) = {
      def doPost = Xhr.post(includeClientIdParam(url), ScalaJsRuntime.decodeSeqs(seq).toJSONString)
      val lastPromiseV = readVar(lastPromise)
      lastPromise = some(lastPromiseV.fold(doPost, previous => Xhr.chain(previous, fun { (_: Rep[String]) => doPost } )))
    }

    /**
     * initialize the client section of 'toServer' calls
     *  i.e., subscribe to the clientCarrier and push new values
     *  to the server using XMLHttpRequest
     */
    private def initClientSideToServer(url: String): Unit = {
      clientEngine.subscribeForPulses(ScalaJsRuntime.encodeFn1(
        fun { pulses: Rep[ScalaJs[Engine.Pulses]] =>
          val pulse = pulses(clientCarrier)

          // Only do the XHR when the SSE is open
          ScalaJsRuntime.decodeOptions(pulse).foreach { seq: Rep[ScalaJs[Seq[Message]]] =>
            // Use option as boolean because adding the IfThenElse trait crashes the compiler?
            if (isSseOpen) scheduleNewXhrPromise(url)(seq)
            else addToQueue(seq)
          }
        }
      ))
      () // Ignore the subscription, it will live as long as the client will
      }

    /**
     * initialize the server section of 'toServer' calls
     *  i.e., listen to POST requests from clients
     *  and push new values to the server Event Sources
     */
    private def initServerSideToServer(url: String): Route =
      path(url) {
        parameter('id) { id =>
          post {
            entity(as[String]) { data =>
              complete {
                // TODO: Make this safe? Log the errors and ignore wrong formats?
                val messages = decode[List[Message]](data).toOption.get
                val pulses = messages.map { message =>
                  serverNamedPulseMakers(message.name)(message.json, Client(id))
                }
                System.out.println("############# NEW EVENT: " + messages)
                serverEngine.fire(pulses)
                "OK"
              }
            }
          }
        }
      }
  }
}
