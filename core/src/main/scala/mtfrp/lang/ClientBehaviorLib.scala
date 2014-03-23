package mtfrp.lang

import scala.js.language.JS

import reactive.Observing
import spray.json.{ JsonWriter, pimpAny }
import spray.routing.Directives.pimpRouteWithConcatenation
import spray.routing.Route

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

    private[this] def copy[A: Manifest](
      route: Option[Route] = this.route,
      rep: Rep[Property[A]] = this.rep,
      observing: Option[Observing] = this.observing): ClientBehavior[A] =
      new ClientBehavior(route, rep, observing)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientBehavior[A] =
      copy(rep = rep map fun(modifier))

    def sampledBy(event: ClientEvent[_]): ClientEvent[T] =
      ClientEvent(route, rep.sampledBy(event.rep), observing)

    def combine[A: Manifest, B: Manifest](that: ClientBehavior[A])(f: (Rep[T], Rep[A]) => Rep[B]): ClientBehavior[B] = {
      val rep = bacon.combineWith(fun(f))(this.rep, that.rep)
      val route = combineRouteOpts(this.route, that.route)
      this.copy(route = route, rep = rep)
    }

    def combine[A: Manifest, B: Manifest, C: Manifest](a: ClientBehavior[A], b: ClientBehavior[B])(f: (Rep[T], Rep[A], Rep[B]) => Rep[C]): ClientBehavior[C] = {
      val rep = bacon.combineWith(fun(f))(this.rep, a.rep, b.rep)
      val route = combineRouteOpts(combineRouteOpts(this.route, a.route), b.route)
      this.copy(route = route, rep = rep)
    }

    def fold[A: Manifest](start: Rep[A])(stepper: (Rep[A], Rep[T]) => Rep[A]): ClientBehavior[A] =
      this.copy(rep = rep.scan(start)(stepper))

  }
}