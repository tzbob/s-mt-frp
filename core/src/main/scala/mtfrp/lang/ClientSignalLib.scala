package mtfrp.lang

import scala.js.language.JS
import spray.routing.Route
import reactive.Observing

trait ClientSignalLib extends JS with BaconLib with ClientEventLib {
  self: ServerSignalLib =>

  object ClientSignal {
    def apply[T: Manifest](init: Rep[T], stepper: ClientEvent[T]) =
      new ClientSignal(stepper.route, stepper.rep toProperty init, stepper.observing)
  }

  class ClientSignal[T: Manifest] private (
      val route: Option[Route],
      val rep: Rep[Property[T]],
      val observing: Option[Observing]) {

    def copy[A: Manifest](
      route: Option[Route] = this.route,
      rep: Rep[Property[A]] = this.rep,
      observing: Option[Observing] = this.observing): ClientSignal[A] =
      new ClientSignal(route, rep, observing)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientSignal[A] =
      copy(rep = rep map fun(modifier))

    def sampledBy(event: ClientEvent[_]): ClientEvent[T] =
      ClientEvent(route, rep.sampledBy(event.rep))
  }
}