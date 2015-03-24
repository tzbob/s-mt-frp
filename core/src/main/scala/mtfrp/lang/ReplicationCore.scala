package mtfrp.lang

import akka.actor._
import akka.pattern.ask
import hokko.core.{ Behavior, Engine, Event => HEvent, EventSource => HEventSource }
import java.net.URLEncoder
import java.util.UUID
import scala.concurrent.duration._
import scala.js.language._
import scala.virtualization.lms.common._
import spray.can.Http
import spray.http._
import spray.http.HttpHeaders._
import spray.http.MediaTypes._
import spray.json._
import spray.routing._
import spray.routing.Directives._
import spray.routing.RequestContext

trait ReplicationCoreLib extends JSJsonFormatLib with EventSources
  with HEvent.EventLib with HEvent.EventStaticLib
  with Engine.EngineLib with Engine.EngineStaticLib
  with Engine.Pulses.PulsesLib with Engine.Values.ValuesLib
  with XMLHttpRequests with DelayedEval
  with JSMaps with ListOps with ListOps2 with TupleOps with OptionOps {

  case class Message(name: String, json: String) extends Adt
  val MessageRep = adt[Message]
  object Message extends DefaultJsonProtocol {
    implicit val messageFormat = jsonFormat2(Message.apply)
  }

  trait ToClientDependency[Res, U] {
    val name = UUID.randomUUID.toString
    val updateData: ToClientDependency.UpdateData[U]
    val stateData: Option[ToClientDependency.StateData[Res]] = None
  }

  object ToClientDependency {
    private def tToMessage[F: JsonWriter](name: String)(t: F) = Message(name, t.toJson.compactPrint)

    class ReplicationData[A: JSJsonReader: Manifest] {
      val source: Rep[ScalaJs[HEventSource[A]]] = EventRep.source[A]
      val mkPulse: Rep[String => ScalaJs[(ScalaJs[HEventSource[A]], A)]] =
        fun { jsonPulse =>
          ScalaJsRuntime.encodeTup2(make_tuple2(source -> jsonPulse.convertToRep[A]))
        }
    }

    case class UpdateData[A: JsonWriter: JSJsonReader: Manifest](
      name: String,
      exit: HEvent[Client => Option[A]]
    ) extends ReplicationData[A] {
      val carrier: HEvent[Client => Option[Message]] = exit.map { fun =>
        (c: Client) => fun(c).map(tToMessage[A](name))
      }
    }

    case class StateData[Init: JsonWriter: JSJsonReader: Manifest](
      name: String,
      behavior: Behavior[Client => Init]
    ) extends ReplicationData[Init] {
      val carrier: Behavior[Client => Message] = behavior.map { fun =>
        c: Client => tToMessage(name)(fun(c))
      }
    }

    def update[U: JsonWriter: JSJsonReader: Manifest](exit: HEvent[Client => Option[U]]): ToClientDependency[U, U] =
      new ToClientDependency[U, U] {
        val updateData = UpdateData(name, exit)
      }

    def stateUpdate[Init: JsonWriter: JSJsonReader: Manifest, U: JsonWriter: JSJsonReader: Manifest](
      stateBehavior: Behavior[Client => Init],
      updates: HEvent[Client => U]
    ): ToClientDependency[Init, U] =
      new ToClientDependency[Init, U] {
        val updateData = UpdateData(name, updates.map { fun =>
          c: Client => Some(fun(c))
        })
        override val stateData = Some(StateData(name, stateBehavior))
      }
  }

  class ToServerDependency[T: JsonReader: JSJsonWriter: Manifest](
    exit: Rep[ScalaJs[HEvent[T]]],
    entry: HEventSource[(Client, T)]
  ) {
    val name = UUID.randomUUID.toString

    val messageCarrier: Rep[ScalaJs[HEvent[Message]]] =
      exit.map(ScalaJsRuntime.encodeFn1(fun { (t: Rep[T]) =>
        MessageRep(unit(name), t.toJSONString)
      }))

    def pulse(jsonPulse: String, clientId: String): (HEventSource[(Client, T)], (Client, T)) = {
      val newPulse = Client(clientId) -> jsonPulse.parseJson.convertTo[T]
      (entry, newPulse)
    }
  }

  object ReplicationCore {
    def empty = ReplicationCore()
    def merge(seq: Seq[ReplicationCore]) =
      seq.foldLeft(ReplicationCore.empty) { (acc, n) =>
        acc.+(n)
      }
  }

  type NamedServerPulseMaker = Map[String, (String, String) => (HEventSource[(Client, T)], (Client, T)) forSome { type T }]
  type NamedClientPulseMaker = Map[String, String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]

  case class ReplicationCore(
    toClientDeps: Set[ToClientDependency[_, _]] = Set.empty,
    toServerDeps: Set[ToServerDependency[_]] = Set.empty
  ) {
    def +(clientDep: ToClientDependency[_, _]): ReplicationCore =
      this.copy(toClientDeps = toClientDeps + clientDep)
    def +(serverDep: ToServerDependency[_]): ReplicationCore =
      this.copy(toServerDeps = toServerDeps + serverDep)
    def +(others: ReplicationCore*): ReplicationCore = {
      def fold[T](v: ReplicationCore => Set[T]) =
        others.foldLeft(v(this))(_ ++ v(_))

      val toClientDeps = fold(_.toClientDeps)
      val toServerDeps = fold(_.toServerDeps)

      ReplicationCore(toClientDeps, toServerDeps)
    }

    /**
     * @returns an initial message carrier from which the client specific
     * to-be-transfered state can be pulled
     */
    lazy val initialCarrier: Behavior[Client => Seq[Message]] = {
      val carriers = toClientDeps.map(_.stateData.map(_.carrier)).flatten
      val seqCarrier = carriers.foldLeft(Behavior.constant(collection.Seq.empty[Client => Message])) { (acc, n) =>
        val fa = n.map { newVal =>
          seq: Seq[Client => Message] => seq :+ newVal
        }
        acc.reverseApply(fa)
      }
      seqCarrier.map { seq =>
        c: Client => seq.map(_(c))
      }
    }

    /**
     * @returns a message carrier that pushes client specific
     * to-be-transfered state
     */
    lazy val serverCarrier: HEvent[Client => Seq[Message]] =
      HEvent.merge(toClientDeps.map(_.updateData.carrier).toSeq).map { seq =>
        c: Client => seq.map(_(c)).flatten
      }

    /**
     * @returns a message carrier that pushes to-be-transfered state
     */
    lazy val clientCarrier: Rep[ScalaJs[HEvent[ScalaJs[Seq[Message]]]]] = {
      val carriers = toServerDeps.map(_.messageCarrier).toSeq
      val lst = ScalaJsRuntime.encodeListAsSeq(List(carriers: _*))
      EventRep.merge(lst)
    }

    def namedPulseMaker(select: ToClientDependency[_, _] => Option[Rep[String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]]): Rep[NamedClientPulseMaker] = {
      val map = JSMap[String, String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]()
      val namedToClientDeps = toClientDeps.foreach { d =>
        select(d).foreach { mkPulse =>
          map.update(unit(d.name), mkPulse)
        }
      }
      map
    }

    /**
     * named pulse makers to inject updates in the FRP network
     */
    lazy val clientNamedUpdatePulseMakers: Rep[NamedClientPulseMaker] =
      namedPulseMaker(x => Some(x.updateData.mkPulse))

    /**
     * named pulse makers to inject resets in the FRP network
     */
    lazy val clientNamedResetPulseMakers: Rep[NamedClientPulseMaker] =
      namedPulseMaker(_.stateData.map(_.mkPulse))

    /**
     * named pulse makers to inject data in the FRP network
     */
    lazy val serverNamedPulseMakers: NamedServerPulseMaker =
      toServerDeps.map { d =>
        (d.name, d.pulse _)
      }.toMap

  }

  /**
   * Responsible for creating server routes and client-side logic to
   * make replication between client and server tiers possible
   */
  class RouteCreator(
    core: ReplicationCore,
    serverEngine: Engine,
    clientEngine: Rep[ScalaJs[Engine]]
  )(implicit actorRef: ActorRefFactory) {

    lazy val serverCarrier = core.serverCarrier
    lazy val serverNamedPulseMakers = core.serverNamedPulseMakers

    lazy val clientCarrier = core.clientCarrier

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

      val sseSource = EventSource(includeClientIdParam(url))

      def listen(rep: Rep[NamedClientPulseMaker])(evt: String) =
        EventSource.listen(sseSource)(unit(evt)) {
          fun { ev: Rep[Dataliteral] =>
            val messages = implicitly[JSJsonReader[List[Message]]].read(ev.data)
            val pulses = messages.map { (message: Rep[Message]) =>
              rep(message.name)(message.json)
            }
            clientEngine.fire(ScalaJsRuntime.encodeListAsSeq(pulses))
          }
        }

      listen(core.clientNamedResetPulseMakers)("reset")
      listen(core.clientNamedUpdatePulseMakers)("update")
    }

    import HttpHeaders.{ `Cache-Control`, `Connection` }
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
            respondAsEventStream {
              ctx =>
                val client = Client(id)

                val streamActor = refFactory.actorOf(Props(new Actor {
                  ctx.responder ! ChunkedResponseStart(
                    HttpResponse(entity = s""": ${" " * 2049}\n""")
                  )

                  def sendMessageChunk(evt: String)(msgsForClient: Client => Seq[Message]) = {
                    val msgs = msgsForClient(client)
                    val data = s"event: $evt\ndata:${msgs.toJson.compactPrint}\n\n"
                    ctx.responder ! MessageChunk(data)
                  }

                  val values = serverEngine.askCurrentValues()
                  values(core.initialCarrier).foreach(sendMessageChunk("reset"))

                  val subscription = serverEngine.subscribeForPulses { pulses =>
                    pulses(serverCarrier).foreach(sendMessageChunk("update"))
                  }

                  // Keep-Alive
                  context.setReceiveTimeout(15 seconds)

                  def receive = {
                    case Http.Close | Http.ConfirmedClose | Http.Abort | Http.PeerClosed | Http.ErrorClosed =>
                      subscription.cancel()
                      context.stop(self)

                    // Comment to keep connection alive
                    case ReceiveTimeout => ctx.responder ! MessageChunk(":\n")
                  }
                }))
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

    /**
     * initialize the client section of 'toServer' calls
     *  i.e., subscribe to the clientCarrier and push new values
     *  to the server using XMLHttpRequest
     */
    private def initClientSideToServer(url: String): Unit =
      clientEngine.subscribeForPulses(ScalaJsRuntime.encodeFn1(
        fun { pulses: Rep[ScalaJs[Engine.Pulses]] =>
          val pulse = pulses(clientCarrier)
          ScalaJsRuntime.decodeOptions(pulse).foreach { seq: Rep[ScalaJs[Seq[Message]]] =>
            val req = XMLHttpRequest()
            req.open(unit("POST"), includeClientIdParam(url))
            req.send(ScalaJsRuntime.decodeSeqs(seq).toJSONString)
          }
        }
      ))

    /**
     * initialize the server section of 'toServer' calls
     *  i.e., listen to POST requests from clients
     *  and push new values to the server EventSources
     */
    private def initServerSideToServer(url: String): Route =
      path(url) {
        parameter('id) { id =>
          post {
            entity(as[String]) { data =>
              complete {
                val messages = data.parseJson.convertTo[List[Message]]
                val pulses = messages.map { message =>
                  serverNamedPulseMakers(message.name)(message.json, id)
                }
                serverEngine.fire(pulses)
                "OK"
              }
            }
          }
        }
      }
  }
}
