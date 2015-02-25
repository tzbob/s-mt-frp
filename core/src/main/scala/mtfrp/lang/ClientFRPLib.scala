package mtfrp.lang

import hokko.core.Event
import hokko.core.Behavior
import hokko.core.IncrementalBehavior
import hokko.core.DiscreteBehavior
import scala.js.language.JS

trait ClientFRPLib extends JS
  with ReplicationCoreLib
  with Event.EventLib
  with Event.EventStaticLib
  with Behavior.BehaviorLib
  with Behavior.BehaviorStaticLib
  with IncrementalBehavior.IncrementalBehaviorLib
  with IncrementalBehavior.IncrementalBehaviorStaticLib
  with DiscreteBehavior.DiscreteBehaviorLib
  with DiscreteBehavior.DiscreteBehaviorStaticLib {

  object ClientEvent {
    def apply[T](rep: Rep[Event[T]], core: Set[Dependency]): ClientEvent[T] =
      new ClientEvent(rep, core)

    def merge[A: Manifest](events: ClientEvent[A]*): ClientEvent[Seq[A]] = {
      val hokkoParams = events.map(_.rep)
      val hokkoEvents: Rep[Seq[Event[A]]] = List(hokkoParams: _*)
      val hokkoMerge: Rep[Event[Seq[A]]] = EventRep.merge(hokkoEvents)
      ClientEvent(hokkoMerge, Set(events.map(_.core): _*).flatten)
    }
  }

  class ClientEvent[+T] private (val rep: Rep[Event[T]], val core: Set[Dependency]) {
    def fold[B, AA >: T](initial: Rep[B])(f: Rep[(B, AA) => B]): ClientIncBehavior[B, AA] =
      ClientIncBehavior(rep.fold(initial)(f), core)

    def unionWith[B, C, AA >: T](b: ClientEvent[B])(f1: Rep[AA => C])(f2: Rep[B => C])(f3: Rep[(AA, B) => C]): ClientEvent[C] =
      ClientEvent(rep.unionWith(b.rep)(f1)(f2)(f3), core ++ b.core)

    def collect[B, AA >: T](fb: Rep[T => Option[B]]): ClientEvent[B] =
      ClientEvent(rep.collect(fb), core)

    // Derived ops

    def hold[U >: T](initial: Rep[U]): ClientBehavior[U] =
      ClientBehavior(rep.hold(initial), core)

    def map[A](modifier: Rep[T => A]): ClientEvent[A] =
      ClientEvent(rep.map(modifier), core)

    def dropIf(pred: Rep[T => Boolean]): ClientEvent[T] =
      ClientEvent(rep.dropIf(pred), core)
  }

  object ClientBehavior {
    def apply[T](rep: Rep[Behavior[T]], core: Set[Dependency]) =
      new ClientBehavior(rep, core)
    def constant[T](const: Rep[T]): ClientBehavior[T] =
      this.apply(BehaviorRep.constant(const), Set.empty[Dependency])
  }

  class ClientBehavior[+A] private[ClientFRPLib] (val rep: Rep[Behavior[A]], val core: Set[Dependency]) {
    def reverseApply[B, AA >: A](fb: ClientBehavior[AA => B]): ClientBehavior[B] =
      ClientBehavior(rep.reverseApply(fb.rep), core ++ fb.core)

    def snapshotWith[B, AA >: A](ev: ClientEvent[AA => B]): ClientEvent[B] =
      ClientEvent(rep.snapshotWith(ev.rep), core ++ ev.core)

    def withChanges[AA >: A](changes: ClientEvent[AA]): ClientDiscreteBehavior[AA] =
      ClientDiscreteBehavior(rep.withChanges(changes.rep), core ++ changes.core)

    // Derived ops

    def map[B](f: Rep[A => B]): ClientBehavior[B] = ClientBehavior(rep.map(f), core)

    def markChanges(marks: ClientEvent[Unit]): ClientDiscreteBehavior[A] =
      ClientDiscreteBehavior(rep.markChanges(marks.rep), core ++ marks.core)
  }

  object ClientDiscreteBehavior {
    def apply[T](rep: Rep[DiscreteBehavior[T]], core: Set[Dependency]): ClientDiscreteBehavior[T] =
      new ClientDiscreteBehavior(rep, core)
  }

  class ClientDiscreteBehavior[+A] private[ClientFRPLib] (
    val rep: Rep[DiscreteBehavior[A]],
    val core: Set[Dependency]
  ) extends ClientBehavior[A](rep, core) {
    def changes(): ClientEvent[A] = ClientEvent(rep.changes(), core)

    def discreteReverseApply[B, AA >: A](fb: ClientDiscreteBehavior[A => B]): ClientDiscreteBehavior[B] =
      ClientDiscreteBehavior(rep.discreteReverseApply(fb.rep), fb.core ++ core)

    def withDeltas[DeltaA, AA >: A](init: Rep[AA], deltas: ClientEvent[DeltaA]): ClientIncBehavior[AA, DeltaA] =
      ClientIncBehavior(rep.withDeltas(init, deltas.rep), deltas.core ++ core)

    override def map[B](f: Rep[A => B]): ClientDiscreteBehavior[B] =
      ClientDiscreteBehavior(rep.map(f), core)
  }

  object ClientIncBehavior {
    def apply[D, T](rep: Rep[IncrementalBehavior[D, T]], core: Set[Dependency]): ClientIncBehavior[D, T] =
      new ClientIncBehavior(rep, core)
  }

  class ClientIncBehavior[+A, +DeltaA] private (
    val rep: Rep[IncrementalBehavior[A, DeltaA]],
    val core: Set[Dependency]
  ) extends ClientBehavior[A](rep, core) {
    def deltas: ClientEvent[DeltaA] = ClientEvent(rep.deltas, core)
  }
}
