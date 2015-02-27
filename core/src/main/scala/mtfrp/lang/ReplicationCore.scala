package mtfrp.lang

import hokko.core.{ Event => HEvent, EventSource => HEventSource, Engine, Behavior }
import java.net.URLEncoder
import java.util.UUID
import scala.js.language._
import scala.virtualization.lms.common._
import spray.http._
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

  class ToClientDependency[T: JsonWriter: JSJsonReader: Manifest](
    initialDataSource: Option[Behavior[Client => T]] = None,
    exit: HEvent[Client => Option[T]],
    entry: Rep[HEventSource[T]]
  ) {
    val name = UUID.randomUUID.toString

    private def tToMessage(t: T) = Message(name, t.toJson.compactPrint)

    val initialCarrier: Option[Behavior[Client => Message]] =
      initialDataSource.map { beh =>
        beh.map { fun =>
          c: Client => tToMessage(fun(c))
        }
      }

    val messageCarrier: HEvent[Client => Option[Message]] =
      exit.map { fun =>
        (c: Client) => fun(c).map(tToMessage)
      }

    val mkPulse: Rep[String => (HEventSource[T], T)] =
      fun { jsonPulse =>
        (entry, jsonPulse.convertToRep[T])
      }
  }

  class ToServerDependency[T: JsonReader: JSJsonWriter: Manifest](
    exit: Rep[HEvent[T]],
    entry: HEventSource[(Client, T)]
  ) {
    val name = UUID.randomUUID.toString

    val messageCarrier: Rep[HEvent[Message]] =
      exit.map(fun { (t: Rep[T]) =>
        MessageRep(unit(name), t.toJSONString)
      })

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
  type NamedClientPulseMaker = Map[String, String => (HEventSource[T], T) forSome { type T }]

  case class ReplicationCore(
    toClientDeps: Set[ToClientDependency[_]] = Set.empty,
    toServerDeps: Set[ToServerDependency[_]] = Set.empty
  ) {
    def +(clientDep: ToClientDependency[_]): ReplicationCore =
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
    def initialCarrier: Behavior[Client => Seq[Message]] = {
      val carriers = toClientDeps.map(_.initialCarrier).flatten
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
    def serverCarrier: HEvent[Client => Seq[Message]] =
      HEvent.merge(toClientDeps.map(_.messageCarrier).toSeq).map { seq =>
        c: Client => seq.map(_(c)).flatten
      }

    /**
     * @returns a message carrier that pushes to-be-transfered state
     */
    def clientCarrier: Rep[HEvent[Seq[Message]]] = {
      val carriers = toServerDeps.map(_.messageCarrier).toSeq
      EventRep.merge(List(carriers: _*))
    }

    /**
     * named pulse makers to inject data in the FRP network
     */
    def clientNamedPulseMakers: Rep[NamedClientPulseMaker] = {
      val map = JSMap[String, String => (HEventSource[T], T) forSome { type T }]()
      val namedToClientDeps = toClientDeps.map { d =>
        (d.name, d.mkPulse)
      }
      namedToClientDeps.foreach {
        case (name, entry) =>
          map.update(unit(name), entry)
      }
      map
    }

    /**
     * named pulse makers to inject data in the FRP network
     */
    def serverNamedPulseMakers: NamedServerPulseMaker =
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
    clientEngine: Rep[Engine]
  ) {
    val serverCarrier = core.serverCarrier
    val serverNamedPulseMakers = core.serverNamedPulseMakers

    val clientCarrier = core.clientCarrier
    val clientNamedPulseMakers = core.clientNamedPulseMakers

    def makeRoute(): Option[Route] = {
      val r1 =
        if (core.toClientDeps.isEmpty)
          Some(initializeToClientDependencies())
        else None

      val r2 =
        if (core.toServerDeps.isEmpty)
          Some(initializeToServerDependencies())
        else None

      r1.fold(r2) { route =>
        r2.map(_ ~ route)
      }
    }

    /**
     * @return optionally, the Route that encompasses all involved client
     * functionality
     */
    def initializeToClientDependencies(): Route = {
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
      sseSource.onmessage = fun { ev: Rep[Dataliteral] =>
        val messages = implicitly[JSJsonReader[List[Message]]].read(ev.data)
        val pulses = messages.map { (message: Rep[Message]) =>
          clientNamedPulseMakers(message.name)(message.json)
        }
        clientEngine.fire(pulses)
      }
    }

    /**
     * initialize the server section of 'toClient' calls
     *  i.e., subscribe to the serverCarrier and push new values
     *  to the client using server sent events
     */
    private def initServerSideToClient(url: String): Route =
      path(url) {
        get {
          parameter('id) { id =>
            ctx =>
              val client = Client(id)
              val padding = s""": ${" " * 2049}\n"""
              val responseStart = HttpResponse(
                entity = HttpEntity(MediaType.custom("text/event-stream"), padding)
              )
              ctx.responder ! ChunkedResponseStart(responseStart)

              val values = serverEngine.askCurrentValues()
              values(core.initialCarrier).foreach { msgsForClient =>
                val msgs = msgsForClient(client)
                val data = s"data:${msgs.toJson.compactPrint}\n\n"
                ctx.responder ! MessageChunk(data)
              }

              serverEngine.subscribeForPulses { pulses =>
                val pulse = pulses(serverCarrier)
                pulse.foreach { msgsForClient =>
                  val msgs = msgsForClient(client)
                  val data = s"data:${msgs.toJson.compactPrint}\n\n"
                  ctx.responder ! MessageChunk(data)
                }
              }
          }
        }
      }

    /**
     *  @return optionally, the Route that encompasses all involved server
     *  functionality
     */
    def initializeToServerDependencies(): Route = {
      val url = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
      initClientSideToServer(url)
      initServerSideToServer(url)
    }

    /**
     * initialize the client section of 'toServer' calls
     *  i.e., subscribe to the clientCarrier and push new values
     *  to the server using XMLHttpRequest
     */
    private def initClientSideToServer(url: String): Unit = {
      clientEngine.subscribeForPulses { pulses: Rep[Engine.Pulses] =>
        val pulse = pulses(clientCarrier)
        pulse.foreach { seq: Rep[Seq[Message]] =>
          val req = XMLHttpRequest()
          req.open(unit("POST"), includeClientIdParam(url))
          req.send(seq.toJSONString)
        }
      }
    }

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
