package mtfrp.lang

import scala.js.language.{ JS, JSLiteral }
import scala.js.language.dom.EventOps
import frp.core.DeltaApplicator
import scala.annotation.implicitNotFound

trait ClientFRPLib extends SFRPClientLib with ReplicationCoreLib with JS {

  object ClientEvent {
    def apply[T: Manifest](rep: Rep[JSEvent[T]], core: ReplicationCore): ClientEvent[T] =
      new ClientEvent(rep, core)
  }

  class ClientEvent[+T: Manifest] private (val rep: Rep[JSEvent[T]], val core: ReplicationCore) {
    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientEvent[A] =
      ClientEvent(rep.map(fun(modifier)), core)

    def or[A >: T: Manifest](that: ClientEvent[A]): ClientEvent[A] =
      ClientEvent(rep.or(that.rep), core.combine(that.core))

    def filter(pred: Rep[T] => Rep[Boolean]): ClientEvent[T] =
      ClientEvent(rep.filter(fun(pred)), core)

    def hold[U >: T: Manifest](initial: Rep[U]): ClientBehavior[U] =
      ClientBehavior(rep.hold(initial), core)

    def fold[A: Manifest](start: Rep[A])(stepper: (Rep[A], Rep[T]) => Rep[A]): ClientBehavior[A] = {
      val f = fun(stepper)
      val folded = rep.foldPast(start, f)
      ClientBehavior(folded, core)
    }

    def combine[B: Manifest, C: Manifest](other: ClientBehavior[B])(combinator: (Rep[T], Rep[B]) => Rep[C]): ClientEvent[C] =
      ClientEvent(rep.combine(other.rep, fun(combinator)), this.core.combine(other.core))

    def combine2[B: Manifest, C: Manifest, D: Manifest](one: ClientBehavior[B], two: ClientBehavior[C])(combinator: (Rep[T], Rep[B], Rep[C]) => Rep[D]): ClientEvent[D] =
      ClientEvent(rep.combine2(one.rep, two.rep, fun(combinator)), this.core.combine(one.core, two.core))

    def incFold[B: Manifest, D >: T: Manifest](initial: Rep[B])(app: ClientDeltaApplicator[B, D]): ClientIncBehavior[D, B] = {
      ClientIncBehavior(rep.incFoldPast(initial, fun(app)), core)
    }
  }

  @implicitNotFound(msg = "Could not find an applicator for delta ${D}.")
  trait ClientDeltaApplicator[A, -D] extends ((Rep[A], Rep[D]) => Rep[A]) with Serializable

  object ClientBehavior {
    def apply[T: Manifest](rep: Rep[JSBehavior[T]], core: ReplicationCore) =
      new ClientBehavior(rep, core)

    def constant[T: Manifest](init: Rep[T]): ClientBehavior[T] =
      new ClientBehavior(FRP.constant(init), ReplicationCore())
  }

  class ClientBehavior[+T: Manifest] private[ClientFRPLib] (val rep: Rep[JSBehavior[T]], val core: ReplicationCore) {
    def delay: ClientEvent[T] = ClientEvent(rep.delay, core)

    def changes: ClientEvent[T] = ClientEvent(rep.changes, core)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientBehavior[A] =
      ClientBehavior(rep.map(fun(modifier)), core)

    def sampledBy(event: ClientEvent[_]): ClientEvent[T] =
      ClientEvent(rep.sampledBy(event.rep), core.combine(event.core))

    def combine[A: Manifest, B: Manifest](that: ClientBehavior[A])(f: (Rep[T], Rep[A]) => Rep[B]): ClientBehavior[B] = {
      val rep = this.rep.combine(that.rep, fun(f))
      ClientBehavior(rep, core.combine(that.core))
    }

    def combine2[A: Manifest, B: Manifest, C: Manifest](a: ClientBehavior[A], b: ClientBehavior[B])(f: (Rep[T], Rep[A], Rep[B]) => Rep[C]): ClientBehavior[C] = {
      val rep = this.rep.combine2(a.rep, b.rep, fun(f))
      ClientBehavior(rep, core.combine(a.core, b.core))
    }
  }

  object ClientIncBehavior {
    def apply[D: Manifest, T: Manifest](rep: Rep[JSIncBehavior[D, T]], core: ReplicationCore): ClientIncBehavior[D, T] =
      new ClientIncBehavior(rep, core)
  }

  class ClientIncBehavior[+D: Manifest, T: Manifest] private (
      override val rep: Rep[JSIncBehavior[D, T]],
      override val core: ReplicationCore) extends ClientBehavior[T](rep, core) {
    def increments: ClientEvent[D] = ClientEvent(rep.increments, core)
  }
}
