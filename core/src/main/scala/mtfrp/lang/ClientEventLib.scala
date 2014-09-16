package mtfrp.lang

import java.net.URLEncoder
import java.util.UUID
import scala.js.language.{ JS, JSLiteral }
import spray.http.{ CacheDirectives, ChunkedResponseStart, HttpHeaders, HttpResponse, MediaType, MessageChunk }
import spray.http.HttpEntity.apply
import spray.json._
import spray.routing.{ Directives, RequestContext, Route }
import spray.routing.Directives._
import scala.js.language.dom.EventOps

trait ClientEventLib extends JSJsonReaderLib with SFRPClientLib with EventSources
    with ReplicationCoreLib with JS with JSLiteral with EventOps with DelayedEval {
  self: ServerEventLib with ClientBehaviorLib =>

  private def initEventSource[T: JSJsonReader: Manifest](src: Rep[JSEventSource[T]], url: String): Rep[EventSource] = {
    val source = EventSource(includeClientIdParam(url))
    source.onmessage = fun { ev: Rep[Dataliteral] =>
      src.fire(implicitly[JSJsonReader[T]] read ev.data)
    }
    source
  }

  private def initRoute[T: JsonWriter](url: String, stream: frp.core.Event[Client => Option[T]]): Route =
    path(url) {
      get {
        parameter('id) { id =>
          val client = Client(id)
          respondWithMediaType(MediaType.custom("text/event-stream")) {
            ctx: RequestContext =>
              ctx.responder ! ChunkedResponseStart(HttpResponse(
                headers = HttpHeaders.`Cache-Control`(CacheDirectives.`no-cache`) :: Nil,
                entity = ":" + (" " * 2049) + "\n" // 2k padding for IE polyfill (yaffle)
                ))
              stream foreach { fun =>
                for (data <- fun(client)) {
                  ctx.responder ! MessageChunk(s"data:${data.toJson.compactPrint}\n\n")
                }
              }
          }
        }
      }
    }

  private[mtfrp] object ClientEvent {
    import Directives._

    def apply[T: Manifest](stream: Rep[JSEvent[T]]): ClientEvent[T] =
      new ClientEvent(stream, ReplicationCore())

    def apply[T: Manifest](
      rep: Rep[JSEvent[T]],
      core: ReplicationCore): ClientEvent[T] =
      new ClientEvent(rep, core)

    def apply[T: JsonWriter: JSJsonReader: Manifest](event: ServerEvent[Client => Option[T]]) = {
      val genUrl = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
      val src = FRP.eventSource[T](globalContext)
      initEventSource(src, genUrl)

      val route = initRoute(genUrl, event.stream)

      new ClientEvent(src, event.core.addRoutes(route))
    }

  }

  implicit class ReactiveToServer[T: JsonReader: JSJsonWriter: Manifest](evt: ClientEvent[T]) {
    def toServer: ServerEvent[(Client, T)] = ServerEvent(evt)
    def toServerAnon: ServerEvent[T] = ServerEvent(evt).map { _._2 }
  }

  class ClientEvent[+T: Manifest] private (
      val rep: Rep[JSEvent[T]],
      val core: ReplicationCore) {

    private[this] def copy[A: Manifest](
      rep: Rep[JSEvent[A]] = this.rep,
      core: ReplicationCore = this.core): ClientEvent[A] =
      new ClientEvent(rep, core)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientEvent[A] = {
      val rep = this.rep.map(fun(modifier))
      this.copy(rep = rep)
    }

    def or[A >: T: Manifest](that: ClientEvent[A]): ClientEvent[A] =
      this.copy(core = core.combine(that.core), rep = rep.or(that.rep))

    def filter(pred: Rep[T] => Rep[Boolean]): ClientEvent[T] =
      this.copy(rep = rep.filter(fun(pred)))

    def hold[U >: T: Manifest](initial: Rep[U]): ClientBehavior[U] =
      ClientBehavior(rep.hold(initial), core)

    def fold[A: Manifest](start: Rep[A])(stepper: (Rep[A], Rep[T]) => Rep[A]): ClientBehavior[A] = {
      val f = fun(stepper)
      val folded = rep.foldPast(start, f)
      ClientBehavior(folded, core)
    }
  }
}
