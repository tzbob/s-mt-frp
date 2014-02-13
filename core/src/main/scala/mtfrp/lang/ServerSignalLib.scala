package mtfrp.lang

import scala.js.language.JS
import reactive.{ Observing, Signal }
import spray.routing.Route

trait ServerSignalLib extends JS with ServerEventLib {
  self: ClientSignalLib =>

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

  object ServerSignal {
    def apply[T](init: T, stepper: ServerEvent[T]) =
      new ServerSignal(stepper.route, stepper.stream hold init, stepper.observing)
  }

  class ServerSignal[T] private (
      val route: Option[Route],
      val signal: Signal[T],
      val observing: Option[Observing]) {

    def copy[A](
      route: Option[Route] = this.route,
      signal: Signal[A] = this.signal,
      observing: Option[Observing] = this.observing): ServerSignal[A] =
      new ServerSignal(route, signal, observing)

    def map[A](modifier: T => A): ServerSignal[A] =
      this.copy(signal = this.signal map modifier)

    def fold[A](start: A)(stepper: (A, T) => A): ServerSignal[A] =
      this.copy(signal = this.signal.foldLeft(start)(stepper))
  }
}