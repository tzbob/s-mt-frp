package mtfrp.lang

import scala.js.language.JS
import spray.json._
import spray.routing.Route
import reactive.Observing
import spray.json.JsonWriter

trait ClientBehaviorLib extends JS with BaconLib with ClientEventLib with DelayedEval {
  self: ServerBehaviorLib =>

  object ClientBehavior {
    def apply[T: Manifest](init: Rep[T], stepper: ClientEvent[T]) =
      new ClientBehavior(stepper.route, stepper.rep toProperty init, stepper.observing)

    def apply[T: JsonWriter: JSJsonReader: Manifest](serverBehavior: ServerBehavior[Client => T]) = {
      def json(client: Client) = unit(serverBehavior.signal.now(client).toJson.compactPrint)
      val currentState = implicitly[JSJsonReader[T]] read delayForClient(json)
      val targetedChanges = serverBehavior.changes.map { fun =>
        client: Client => Some(fun(client))
      }
      ClientEvent(targetedChanges) hold currentState
    }

  }

  class ClientBehavior[+T: Manifest] private (
      val route: Option[Route],
      val rep: Rep[Property[T]],
      val observing: Option[Observing]) {

    def copy[A: Manifest](
      route: Option[Route] = this.route,
      rep: Rep[Property[A]] = this.rep,
      observing: Option[Observing] = this.observing): ClientBehavior[A] =
      new ClientBehavior(route, rep, observing)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientBehavior[A] =
      copy(rep = rep map fun(modifier))

    def sampledBy(event: ClientEvent[_]): ClientEvent[T] =
      ClientEvent(route, rep.sampledBy(event.rep), observing)
  }
}