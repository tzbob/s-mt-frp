package mtfrp.lang

import scala.js.exp.{ FFIExp, JSExp }
import reactive.Signal
import spray.routing.Route

trait ServerSignalLib {
  self: JSJsonWriterContext with JSJsonReaderContext with JSExp with FFIExp =>

  //  private def syncAjaxGet(url: Rep[String]): Rep[String] =
  //    foreign"""$$.ajax({type: "GET", url: $url, async: false}).responseText""".withEffect()
  //
  //  implicit class ReactiveToClient[T: RootJsonWriter: JSJsonReader: Manifest](ses: ServerSignal[T]) extends Directives {
  //    import spray.httpx.SprayJsonSupport._
  //
  //    //    def toClient: ClientSignal[T] = {
  //    //      val clientStream = ClientStream(ses.signal.change, ses.initRoute)
  //    //      val genUrl = URLEncoder encode UUID.randomUUID.toString
  //    //      val initRoute = path(genUrl) {
  //    //        get {
  //    //          respondWithMediaType(MediaTypes.`application/json`) {
  //    //            complete(ses.signal.now)
  //    //          }
  //    //        }
  //    //      }
  //    //      val clientSignal = clientStream.hold(implicitly[JSJsonReader[T]].read(syncAjaxGet(genUrl)))
  //    //      val newRoute = clientSignal.initRoute.map(_ ~ initRoute) getOrElse initRoute
  //    //      new ClientSignal(Some(newRoute), clientSignal.rep)
  //    //    }
  //
  //  }

  class ServerSignal[T] private[lang] (
      val initRoute: Option[Route],
      val signal: Signal[T]) {

    def map[A](modifier: T => A): ServerSignal[A] =
      new ServerSignal(initRoute, signal.map(modifier))

    def fold[A](start: A)(stepper: (A, T) => A): ServerSignal[A] =
      new ServerSignal(initRoute, signal.foldLeft(start)(stepper))
  }
}