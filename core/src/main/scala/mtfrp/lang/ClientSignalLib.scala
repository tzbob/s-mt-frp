package mtfrp.lang

import scala.js.language.JS
import spray.json._
import spray.routing.Route
import reactive.Observing
import spray.json.JsonWriter

trait ClientSignalLib extends JS with BaconLib with ClientEventLib with DelayedEval {
  self: ServerSignalLib =>

  object ClientSignal {
    def apply[T: Manifest](init: Rep[T], stepper: ClientEvent[T]) =
      new ClientSignal(stepper.route, stepper.rep toProperty init, stepper.observing)

    def apply[T: JsonWriter: JSJsonReader: Manifest](serverSignal: ServerSignal[T]) = {
      def json() = unit(serverSignal.signal.now.toJson.compactPrint)
      val currentState = implicitly[JSJsonReader[T]] read delayEval(json)
      val any: Client => Boolean = _ => true
      val targetedChanges = serverSignal.changes.map { (any, _) }
      ClientEvent(targetedChanges) hold currentState
    }

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
      ClientEvent(route, rep.sampledBy(event.rep), observing)
  }
}