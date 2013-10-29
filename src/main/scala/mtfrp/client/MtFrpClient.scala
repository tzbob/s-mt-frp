package mtfrp.client

import java.net.URLEncoder
import java.util.UUID
import scala.js.exp.CastsCheckedExp
import scala.js.exp.JSExp
import scala.js.exp.RecordsExp
import scala.js.exp.dom.BrowserExp
import scala.js.language.Casts
import scala.virtualization.lms.common.FunctionsExp
import scala.virtualization.lms.common.StructExp
import akka.actor.actorRef2Scala
import reactive.EventStream
import reactive.Observing
import spray.http.CacheDirectives
import spray.http.ChunkedResponseStart
import spray.http.HttpEntity.apply
import spray.http.HttpHeaders
import spray.http.HttpResponse
import spray.http.MediaType
import spray.http.MessageChunk
import spray.json._
import spray.json.JsonWriter
import spray.routing.Directive.pimpApply
import spray.routing.Directives
import spray.routing.RequestContext
import spray.routing.Route

trait MtFrpClient
    extends BaconLibExp
    with FunctionsExp
    with BrowserExp
    with JSExp
    with Casts
    with JSJsonReaderContext {
  import spray.json._
  import DefaultJsonProtocol._

  def main: ClientEventStream[String]

  implicit class ElementOpsInnerHTML(e: Exp[Element]) {
    def setInnerHTML(value: Rep[String]): Rep[Unit] =
      foreign"$e.innerHTML = $value".withEffect()
  }

  private def eventSource(url: Rep[String], callback: Rep[Record { val data: String } => Unit]): Rep[Unit] =
    foreign"""new EventSource($url).onmessage = $callback""".withEffect()

  private[mtfrp] object ClientEventStream extends Directives {
    // TODO find a better spot?
    implicit val observing = new Observing {}

    def fromStream[T: JsonWriter: JSJsonReader: Manifest](stream: EventStream[T],
      route: Option[Route] = None): ClientEventStream[T] = {

      val genUrl = URLEncoder encode UUID.randomUUID.toString
      val bus = bacon.Bus[T]

      val initRoute = path(genUrl) {
        get {
          respondWithMediaType(MediaType.custom("text/event-stream")) {
            (ctx: RequestContext) =>
              ctx.responder ! ChunkedResponseStart(HttpResponse(
                headers = HttpHeaders.`Cache-Control`(CacheDirectives.`no-cache`) :: Nil,
                entity = ":" + (" " * 2049) + "\n" // 2k padding for IE polyfill (yaffle)
              ))
              stream foreach { data =>
                ctx.responder ! MessageChunk(s"data:${data.toJson.compactPrint}\n\n")
              }
          }
        }
      }

      val initExp = makeInitExp(bus, genUrl)

      val newRoute = route.map(_ ~ initRoute) getOrElse initRoute
      new ClientEventStream(newRoute, initExp, bus)
    }
  }

  private def makeInitExp[T: JSJsonReader: Manifest](bus: Bus[T], url: String) =
    eventSource(url, fun { ev =>
      val payload = implicitly[JSJsonReader[T]] read ev.data
      bus push payload
    })

  class ClientEventStream[T: Manifest] private (
      val initRoute: Route,
      val initExp: Exp[Unit],
      val exp: Exp[BaconStream[T]]) {

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientEventStream[A] =
      new ClientEventStream(initRoute, initExp, exp.map(fun(modifier)))
  }

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](stream: EventStream[T]) {
    def toClient: ClientEventStream[T] = ClientEventStream fromStream stream
  }

}