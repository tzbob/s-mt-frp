package mtfrp.server

import mtfrp.client.{ ClientEventStreamLib, JSJsonReaderContext }
import spray.json.{ JsonReader, JsonWriter, pimpString }
import mtfrp.client.ClientSignalLib
import reactive.Val
import reactive.Signal
import spray.routing.Route
import scala.js.language.JS
import scala.js.exp.JSExp
import java.net.URLEncoder
import java.util.UUID
import scala.js.exp.FFIExp
import spray.routing.Directives
import spray.http.MediaType
import spray.http.MediaTypes
import spray.json.RootJsonWriter

trait ServerSignalLib {
  self: JSJsonWriterContext with JSJsonReaderContext with ServerEventStreamLib with ClientSignalLib with ClientEventStreamLib with JSExp with FFIExp =>

  private def syncAjaxGet(url: Rep[String]): Rep[String] =
    foreign"""$$.ajax({type: "GET", url: $url, async: false}).responseText""".withEffect()

  implicit class ReactiveToClient[T: RootJsonWriter: JSJsonReader: Manifest](ses: ServerSignal[T]) extends Directives {
    import spray.httpx.SprayJsonSupport._

    def toClient: ClientSignal[T] = {
      val clientStream = ClientEventStream fromStream (ses.signal.change, ses.initRoute)
      val genUrl = URLEncoder encode UUID.randomUUID.toString
      val initRoute = path(genUrl) {
        get {
          respondWithMediaType(MediaTypes.`application/json`) {
            complete(ses.signal.now)
          }
        }
      }
      val clientSignal = clientStream.hold(implicitly[JSJsonReader[T]].read(syncAjaxGet(genUrl)))
      val newRoute = clientSignal.initRoute.map(_ ~ initRoute) getOrElse initRoute
      new ClientSignal(Some(newRoute), clientSignal.exp)
    }

  }

  class ServerSignal[T] private[server] (
      val initRoute: Option[Route],
      val signal: Signal[T]) {

    def map[A](modifier: T => A): ServerSignal[A] =
      new ServerSignal(initRoute, signal.map(modifier))

    def fold[A](start: A)(stepper: (A, T) => A): ServerSignal[A] =
      new ServerSignal(initRoute, signal.foldLeft(start)(stepper))
  }
}