package mtfrp.client

import java.net.URLEncoder
import java.util.UUID

import scala.js.exp.JSExp

import mtfrp.client.frp.BaconLibExp
import reactive.{ EventStream, Observing }
import spray.http.{ CacheDirectives, ChunkedResponseStart, HttpHeaders, HttpResponse, MediaType, MessageChunk }
import spray.json.{ JsonWriter, _ }
import spray.routing.{ Directives, RequestContext, Route }

trait ClientEventStreamLib {
  self: JSJsonReaderContext with BaconLibExp with JSExp with ClientSignalLib =>

  private def eventSource(url: Rep[String], callback: Rep[Record { val data: String } => Unit]): Rep[Unit] =
    foreign"""new EventSource($url).onmessage = $callback""".withEffect()

  private[mtfrp] object ClientEventStream extends Directives {
    // TODO find a better spot?
    implicit val observing = new Observing {}

    def apply[T: Manifest](stream: Rep[BaconStream[T]]): ClientEventStream[T] =
      new ClientEventStream(None, stream)

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
      new ClientEventStream(Some(newRoute), bus)
    }
  }

  private def makeInitExp[T: JSJsonReader: Manifest](bus: Bus[T], url: String) =
    eventSource(url, fun { ev =>
      val payload = implicitly[JSJsonReader[T]] read ev.data
      bus push payload
    })

  class ClientEventStream[T: Manifest] private (
      val initRoute: Option[Route],
      val exp: Exp[BaconStream[T]]) {

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientEventStream[A] =
      new ClientEventStream(initRoute, exp.map(fun(modifier)))

    def fold[A: Manifest](start: A)(stepper: (Rep[A], Rep[T]) => Rep[A]): ClientEventStream[A] =
      new ClientEventStream(initRoute, exp.fold(start)(fun(stepper)))

    def merge[A >: T: Manifest](stream: ClientEventStream[A]): ClientEventStream[A] =
      new ClientEventStream(initRoute, exp.merge(stream.exp))

    def hold(initial: Rep[T]): ClientSignal[T] =
      new ClientSignal(initRoute, exp.toProperty(initial))
  }
}