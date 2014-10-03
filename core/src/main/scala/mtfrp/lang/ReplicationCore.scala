package mtfrp.lang

import spray.routing.Route
import spray.routing.Directives._
import java.net.URLEncoder
import java.util.UUID
import spray.json._
import scala.js.language.JSMaps
import spray.http.MediaType
import spray.routing.RequestContext
import spray.http.ChunkedResponseStart
import spray.http.HttpResponse
import spray.http.HttpHeaders
import spray.http.CacheDirectives
import spray.routing.RequestContext
import spray.http.MessageChunk
import scala.slick.jdbc.JdbcBackend.SessionDef
import scala.slick.driver.JdbcProfile
import frp.core.TickContext

trait ReplicationCoreLib extends JSJsonFormatLib with EventSources with DatabaseFunctionality
    with SFRPClientLib with XMLHttpRequests with DelayedEval with JSMaps {
  import driver.simple._

  implicit val serverContext = new TickContext

  object Message extends DefaultJsonProtocol {
    implicit val messageFormat = jsonFormat2(Message.apply)
  }
  case class Message(name: String, json: String) extends Adt
  val MessageRep = adt[Message]

  case class ReplicationCore(
      toClientDeps: Set[ToClientDependency[_]] = Set.empty,
      toServerDeps: Set[ToServerDependency[_]] = Set.empty,
      manipDeps: Set[frp.core.Event[ManipulationDependency]] = Set.empty) {
    def combine(others: ReplicationCore*): ReplicationCore = {
      def fold[T](v: ReplicationCore => Set[T]) = others.foldLeft(v(this))(_ ++ v(_))
      val toClientDeps = fold(_.toClientDeps)
      val toServerDeps = fold(_.toServerDeps)
      val manipDeps = fold(_.manipDeps)
      ReplicationCore(toClientDeps, toServerDeps, manipDeps)
    }

    def addToServerDependencies(deps: ToServerDependency[_]*): ReplicationCore =
      this.copy(toServerDeps = this.toServerDeps ++ deps)

    def addToClientDependencies(deps: ToClientDependency[_]*): ReplicationCore =
      this.copy(toClientDeps = this.toClientDeps ++ deps)

    def addManipulationDependencies(deps: frp.core.Event[ManipulationDependency]*): ReplicationCore =
      this.copy(manipDeps = this.manipDeps ++ deps)

    def route: Option[Route] = {
      val r1 = initializeToClientDependencies()
      val r2 = initializeToServerDependencies()
      if (r1.isDefined)
        if (r2.isDefined) Some(r1.get ~ r2.get)
        else Some(r1.get)
      else None
    }

    def mergedManipulatorDependencies: frp.core.Event[Map[Session => Unit, Seq[ManipulationDependency]]] =
      frp.core.Event.merge(manipDeps.toSeq: _*).map(_.groupBy(_.manipulator))

    /**
     * @return optionally, the Route that encompasses all involved client
     * functionality
     */
    def initializeToClientDependencies(): Option[Route] =
      if (!toClientDeps.isEmpty) {
        val genUrl = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
        initClientSideToClient(genUrl, toClientDeps)
        Some(initServerSideToClient(genUrl, toClientDeps))
      } else None

    /**
     *  @return optionally, the Route that encompasses all involved server
     *  functionality
     */
    def initializeToServerDependencies(): Option[Route] =
      if (!toServerDeps.isEmpty) {
        val genUrl = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
        initClientSideToServer(genUrl, toServerDeps)
        Some(initServerSideToServer(genUrl, toServerDeps))
      } else None
  }

  private def initClientSideToClient(
    genUrl: String, toClientDeps: Set[ToClientDependency[_]]): Unit = {
    implicit def messageOps(m: Rep[Message]) = adtOps(m)

    val namedClientEntryPoints = {
      val map = JSMap[String, ((String, Batch)) => Unit]()
      val namedToClientDeps = toClientDeps.map { d =>
        (d.name, d.clientFRPEntryPoint)
      }
      namedToClientDeps.foreach { case (name, entry) => map.update(name, entry) }
      map
    }

    val sseSource = EventSource(includeClientIdParam(genUrl))
    sseSource.onmessage = fun { ev: Rep[Dataliteral] =>
      val messages = implicitly[JSJsonReader[List[Message]]].read(ev.data)
      FRP.withBatch(FRP.global, fun { (batch: Rep[Batch]) =>
        messages.foreach { (message: Rep[Message]) =>
          namedClientEntryPoints(message.name)((message.json, batch))
        }
      })
    }
  }

  private def initServerSideToClient(
    genUrl: String, toClientDeps: Set[ToClientDependency[_]]): Route = {
    // create one exit point for all involved frp.core.Events
    val messageCarriers = toClientDeps.map(_.messageCarrier).toSeq
    val exitPoint = frp.core.Event.merge(messageCarriers: _*)
    path(genUrl) {
      get {
        parameter('id) { id =>
          val client = Client(id)
          respondWithMediaType(MediaType.custom("text/event-stream")) {
            ctx: RequestContext =>
              ctx.responder ! ChunkedResponseStart(HttpResponse(
                headers = HttpHeaders.`Cache-Control`(CacheDirectives.`no-cache`) :: Nil,
                entity = ":" + (" " * 2049) + "\n" // 2k padding for IE polyfill (yaffle)
                ))

              exitPoint.foreach { seq =>
                val msgs = seq.map(_(client)).flatten
                ctx.responder ! MessageChunk(s"data:${msgs.toJson.compactPrint}\n\n")
              }
          }
        }
      }
    }

  }

  private def initClientSideToServer(
    genUrl: String, toServerDeps: Set[ToServerDependency[_]]): Unit = {
    // create one exit point for all involved JSEvents
    val messageCarriers = toServerDeps.map(_.messageCarrier).toSeq
    val clientExitPoint: Rep[JSEvent[Seq[Message]]] =
      FRP.merge(List(messageCarriers: _*))

    clientExitPoint.foreach(fun { (value: Rep[Seq[Message]]) =>
      val req = XMLHttpRequest()
      req.open("POST", includeClientIdParam(genUrl))
      req.send(value.toJSONString)
    }, FRP.global)
  }

  private def initServerSideToServer(
    genUrl: String, toServerDeps: Set[ToServerDependency[_]]): Route = {

    val namedToServerDeps = toServerDeps.map { d =>
      (d.name, d)
    }.toMap[String, ToServerDependency[_]]

    path(genUrl) {
      parameter('id) { id =>
        post {
          entity(as[String]) { data =>
            complete {
              val messages = data.parseJson.convertTo[Seq[Message]]
              serverContext.withBatch { batch =>
                messages.foreach { message =>
                  namedToServerDeps(message.name)
                    .fireIntoServerFRP(message.json, id, batch)
                }
              }
              "OK"
            }
          }
        }
      }
    }
  }

  class ToClientDependency[T: JsonWriter: JSJsonReader: Manifest](
      serverEvent: frp.core.Event[Client => Option[T]],
      clientEventSource: Rep[JSEventSource[T]]) {
    val name = UUID.randomUUID.toString

    def clientFRPEntryPoint: Rep[((String, Batch)) => Unit] =
      makeEntryPoint(clientEventSource)

    def messageCarrier: frp.core.Event[Client => Option[Message]] = {
      serverEvent.map { (fun: Client => Option[T]) =>
        (c: Client) => fun(c).map { t => Message(name, t.toJson.compactPrint) }
      }
    }
  }

  private def makeEntryPoint[T: JSJsonReader: Manifest](
    src: Rep[JSEventSource[T]]): Rep[((String, Batch)) => Unit] =
    fun { (json: Rep[String], batch: Rep[Batch]) =>
      src.batchFire(json.convertToRep[T], batch)
    }

  class ToServerDependency[T: JsonReader: JSJsonWriter: Manifest](
      clientEvent: Rep[JSEvent[T]],
      serverEventSource: frp.core.EventSource[(Client, T)]) {

    val name = UUID.randomUUID.toString
    def messageCarrier: Rep[JSEvent[Message]] =
      makeCarrier(clientEvent, name)

    def fireIntoServerFRP(json: String, id: String, batch: frp.core.Batch): Unit = {
      val newValue = Client(id) -> json.parseJson.convertTo[T]
      serverEventSource.batchFire(newValue)(batch)
    }
  }

  private def makeCarrier[T: JSJsonWriter: Manifest](evt: Rep[JSEvent[T]], name: String) =
    evt.map(fun { t => MessageRep(name, t.toJSONString) })

  case class ManipulationDependency(
    trigger: Session => Unit,
    manipulator: Session => Unit)
}