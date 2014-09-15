package mtfrp.lang

import scala.js.language.JS

import spray.json.{ JsonWriter, pimpAny }
import spray.routing.Directives.pimpRouteWithConcatenation
import spray.routing.Route

trait ClientBehaviorLib extends JS with SFRPClientLib with ClientEventLib with DelayedEval {
  self: ServerBehaviorLib =>

  object ClientBehavior {
    def apply[T: Manifest](init: Rep[T], stepper: ClientEvent[T]) =
      new ClientBehavior(stepper.rep.hold(init), stepper.core)

    def apply[T: JsonWriter: JSJsonReader: Manifest](serverBehavior: ServerBehavior[Client => T]) = {
      def json(client: Client) = {
        val ticket = serverBehavior.behavior.markExit
        unit(ticket.now()(client).toJson.compactPrint)
      }
      val currentState = implicitly[JSJsonReader[T]] read delayForClient(json)
      val targetedChanges = serverBehavior.changes.map { fun =>
        client: Client => Some(fun(client))
      }
      targetedChanges.toClient hold currentState
    }

  }

  class ClientBehavior[+T: Manifest] private (
    val rep: Rep[JSBehavior[T]],
    val core: ServerCore) {

    private[this] def copy[A: Manifest](
      rep: Rep[JSBehavior[A]] = this.rep,
      core: ServerCore = this.core): ClientBehavior[A] =
      new ClientBehavior(rep, core)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientBehavior[A] =
      copy(rep = rep.map(fun(modifier)))

    def sampledBy(event: ClientEvent[_]): ClientEvent[T] =
      ClientEvent(rep.sampledBy(event.rep), core.combine(event.core))

    def combine[A: Manifest, B: Manifest](that: ClientBehavior[A])(f: (Rep[T], Rep[A]) => Rep[B]): ClientBehavior[B] = {
      val rep = this.rep.combine(that.rep, fun(f))
      this.copy(rep, core.combine(that.core))
    }

    def combine2[A: Manifest, B: Manifest, C: Manifest](a: ClientBehavior[A], b: ClientBehavior[B])(f: (Rep[T], Rep[A], Rep[B]) => Rep[C]): ClientBehavior[C] = {
      val rep = this.rep.combine2(a.rep, b.rep, fun(f))
      this.copy(rep, core.combine(a.core, b.core))
    }

    //    def fold[A: Manifest](start: Rep[A])(stepper: (Rep[A], Rep[T]) => Rep[A]): ClientBehavior[A] =
    //      this.copy(rep = rep.foldPast(start, stepper))

  }
}