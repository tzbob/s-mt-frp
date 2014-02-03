package mtfrp.lang

import scala.js.language.JS
import spray.routing.Route

trait ClientSignalLib extends JS with BaconLib with ClientEventLib {
  self: ServerEventLib =>

  class ClientSignal[T: Manifest] private[mtfrp] (
      val route: Option[Route],
      val rep: Rep[Property[T]]) {

    def copy[A: Manifest](
      route: Option[Route] = this.route,
      rep: Rep[Property[A]] = this.rep): ClientSignal[A] =
      new ClientSignal(route, rep)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientSignal[A] =
      copy(rep = rep.map(fun(modifier)))

    def sampledBy(event: ClientEvent[_]): ClientEvent[T] =
      ClientEvent(route, rep.sampledBy(event.rep))
  }
}