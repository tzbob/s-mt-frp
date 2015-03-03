package mtfrp.lang

import hokko.core.{Behavior, DiscreteBehavior, Event => HEvent, IncrementalBehavior}
import scala.js.language.JS

trait ClientFRPLib extends JS
  with ReplicationCoreLib
  with HEvent.EventLib
  with HEvent.EventStaticLib
  with Behavior.BehaviorLib
  with Behavior.BehaviorStaticLib
  with IncrementalBehavior.IncrementalBehaviorLib
  with IncrementalBehavior.IncrementalBehaviorStaticLib
  with DiscreteBehavior.DiscreteBehaviorLib
  with DiscreteBehavior.DiscreteBehaviorStaticLib {

  object ClientEvent {
    def apply[T](rep: Rep[HEvent[T]], core: ReplicationCore): ClientEvent[T] =
      new ClientEvent(rep, core)

    def merge[A: Manifest](events: ClientEvent[A]*): ClientEvent[Seq[A]] = {
      val hokkoParams = events.map(_.rep)
      val hokkoEvents: Rep[Seq[HEvent[A]]] = List(hokkoParams: _*)
      val hokkoMerge: Rep[HEvent[Seq[A]]] = EventRep.merge(hokkoEvents)
      ClientEvent(hokkoMerge, ReplicationCore.merge(events.map(_.core)))
    }
  }

  class ClientEvent[+T] private (val rep: Rep[HEvent[T]], val core: ReplicationCore) {
    def fold[B, AA >: T](initial: Rep[B])(f: Rep[(B, AA) => B]): ClientIncBehavior[B, AA] =
      ClientIncBehavior(rep.fold(initial)(f), core)

    def unionWith[B, C, AA >: T](b: ClientEvent[B])(f1: Rep[AA => C])(f2: Rep[B => C])(f3: Rep[(AA, B) => C]): ClientEvent[C] =
      ClientEvent(rep.unionWith(b.rep)(f1)(f2)(f3), core + b.core)

    def collect[B, AA >: T](fb: Rep[T => Option[B]]): ClientEvent[B] =
      ClientEvent(rep.collect(fb), core)

    // Derived ops

    def hold[U >: T](initial: Rep[U]): ClientDiscreteBehavior[U] =
      ClientDiscreteBehavior(rep.hold(initial), core)

    def map[A](modifier: Rep[T => A]): ClientEvent[A] =
      ClientEvent(rep.map(modifier), core)

    def dropIf(pred: Rep[T => Boolean]): ClientEvent[T] =
      ClientEvent(rep.dropIf(pred), core)
  }

  object ClientBehavior {
    def apply[T](rep: Rep[Behavior[T]], core: ReplicationCore) =
      new ClientBehavior(rep, core)
    def constant[T](const: Rep[T]): ClientBehavior[T] =
      this.apply(BehaviorRep.constant(const), ReplicationCore.empty)
  }

  class ClientBehavior[+A] private[ClientFRPLib] (val rep: Rep[Behavior[A]], val core: ReplicationCore) {
    def reverseApply[B, AA >: A](fb: ClientBehavior[AA => B]): ClientBehavior[B] =
      ClientBehavior(rep.reverseApply(fb.rep), core + fb.core)

    def snapshotWith[B, AA >: A](ev: ClientEvent[AA => B]): ClientEvent[B] =
      ClientEvent(rep.snapshotWith(ev.rep), core + ev.core)

    def withChanges[AA >: A](changes: ClientEvent[AA]): ClientDiscreteBehavior[AA] =
      ClientDiscreteBehavior(rep.withChanges(changes.rep), core + changes.core)

    // Derived ops

    def map[B](f: Rep[A => B]): ClientBehavior[B] = ClientBehavior(rep.map(f), core)

    def markChanges(marks: ClientEvent[Unit]): ClientDiscreteBehavior[A] =
      ClientDiscreteBehavior(rep.markChanges(marks.rep), core + marks.core)
  }

  object ClientDiscreteBehavior {
    def apply[T](rep: Rep[DiscreteBehavior[T]], core: ReplicationCore): ClientDiscreteBehavior[T] =
      new ClientDiscreteBehavior(rep, core)
  }

  class ClientDiscreteBehavior[+A] private[ClientFRPLib] (
    val rep: Rep[DiscreteBehavior[A]],
    val core: ReplicationCore
  ) extends ClientBehavior[A](rep, core) {
    def changes(): ClientEvent[A] = ClientEvent(rep.changes(), core)

    def discreteReverseApply[B, AA >: A](fb: ClientDiscreteBehavior[A => B]): ClientDiscreteBehavior[B] =
      ClientDiscreteBehavior(rep.discreteReverseApply(fb.rep), fb.core + core)

    def withDeltas[DeltaA, AA >: A](init: Rep[AA], deltas: ClientEvent[DeltaA]): ClientIncBehavior[AA, DeltaA] =
      ClientIncBehavior(rep.withDeltas(init, deltas.rep), deltas.core + core)

    override def map[B](f: Rep[A => B]): ClientDiscreteBehavior[B] =
      ClientDiscreteBehavior(rep.map(f), core)
  }

  object ClientIncBehavior {
    def apply[D, T](rep: Rep[IncrementalBehavior[D, T]], core: ReplicationCore): ClientIncBehavior[D, T] =
      new ClientIncBehavior(rep, core)
  }

  class ClientIncBehavior[+A, +DeltaA] private (
    val rep: Rep[IncrementalBehavior[A, DeltaA]],
    val core: ReplicationCore
  ) extends ClientBehavior[A](rep, core) {
    def deltas: ClientEvent[DeltaA] = ClientEvent(rep.deltas, core)
  }
}
