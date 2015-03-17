package mtfrp.lang

import hokko.core.{ Behavior, DiscreteBehavior, Event => HEvent, IncrementalBehavior }
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
    def apply[T: Manifest](rep: Rep[ScalaJs[HEvent[T]]], core: ReplicationCore): ClientEvent[T] =
      new ClientEvent(rep, core)

    def merge[A: Manifest](events: ClientEvent[A]*): ClientEvent[ScalaJs[Seq[A]]] = {
      val hokkoParams = events.map(_.rep)
      val hokkoSeqEvents: Rep[Seq[ScalaJs[HEvent[A]]]] = List(hokkoParams: _*)
      val hokkoMerge = EventRep.merge(hokkoSeqEvents.encode)
      ClientEvent(hokkoMerge, ReplicationCore.merge(events.map(_.core)))
    }

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientEvent[A => B]): ClientEvent[ScalaJs[A => B]] =
      f.map(fun { (p: Rep[A => B]) => p.encode })
  }

  class ClientEvent[+T: Manifest] private (
    val rep: Rep[ScalaJs[HEvent[T]]],
    val core: ReplicationCore
  ) {
    def fold[B: Manifest, AA >: T: Manifest](initial: Rep[B])(f: Rep[(B, AA) => B]): ClientIncBehavior[B, AA] =
      ClientIncBehavior(rep.fold(initial)(f.encode), core)

    def unionWith[B: Manifest, C: Manifest, AA >: T: Manifest](b: ClientEvent[B])(f1: Rep[AA => C])(f2: Rep[B => C])(f3: Rep[(AA, B) => C]): ClientEvent[C] =
      ClientEvent(rep.unionWith(b.rep)(f1.encode)(f2.encode)(f3.encode), core + b.core)

    def collect[B: Manifest, AA >: T: Manifest](fb: Rep[T => Option[B]]): ClientEvent[B] = {
      val scalaJsFun = fun { (p: Rep[T]) =>
        fb(p).encode
      }.encode
      ClientEvent(rep.collect(scalaJsFun), core)
    }

    // Derived ops

    def hold[U >: T: Manifest](initial: Rep[U]): ClientDiscreteBehavior[U] =
      ClientDiscreteBehavior(rep.hold(initial), core)

    def map[A: Manifest](modifier: Rep[T => A]): ClientEvent[A] =
      ClientEvent(rep.map(modifier.encode), core)

    def dropIf(pred: Rep[T => Boolean]): ClientEvent[T] =
      ClientEvent(rep.dropIf(pred.encode), core)
  }

  object ClientBehavior {
    def apply[T: Manifest](rep: Rep[ScalaJs[Behavior[T]]], core: ReplicationCore) =
      new ClientBehavior(rep, core)
    def constant[T: Manifest](const: Rep[T]): ClientBehavior[T] =
      this.apply(BehaviorRep.constant(const), ReplicationCore.empty)

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientBehavior[A => B]): ClientBehavior[ScalaJs[A => B]] =
      f.map(fun { (p: Rep[A => B]) => p.encode })
  }

  class ClientBehavior[+A: Manifest] private[ClientFRPLib] (
    val rep: Rep[ScalaJs[Behavior[A]]],
    val core: ReplicationCore
  ) {
    def reverseApply[B: Manifest, AA >: A: Manifest](fb: ClientBehavior[AA => B]): ClientBehavior[B] = {
      val fbB = ClientBehavior.toBoxedFuns(fb)
      ClientBehavior(rep.reverseApply(fbB.rep), core + fbB.core)
    }

    def snapshotWith[B: Manifest, AA >: A: Manifest](ev: ClientEvent[AA => B]): ClientEvent[B] = {
      val evB = ClientEvent.toBoxedFuns(ev)
      ClientEvent(rep.snapshotWith(evB.rep), core + evB.core)
    }

    def withChanges[AA >: A: Manifest](changes: ClientEvent[AA]): ClientDiscreteBehavior[AA] =
      ClientDiscreteBehavior(rep.withChanges(changes.rep), core + changes.core)

    // Derived ops

    def map[B: Manifest](f: Rep[A => B]): ClientBehavior[B] =
      ClientBehavior(rep.map(f.encode), core)

    def markChanges(marks: ClientEvent[Unit]): ClientDiscreteBehavior[A] =
      ClientDiscreteBehavior(rep.markChanges(marks.rep), core + marks.core)
  }

  object ClientDiscreteBehavior {
    def apply[T: Manifest](rep: Rep[ScalaJs[DiscreteBehavior[T]]], core: ReplicationCore): ClientDiscreteBehavior[T] =
      new ClientDiscreteBehavior(rep, core)
    def constant[T: Manifest](const: Rep[T]): ClientDiscreteBehavior[T] =
      this.apply(DiscreteBehaviorRep.constant(const), ReplicationCore.empty)

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientDiscreteBehavior[A => B]): ClientDiscreteBehavior[ScalaJs[A => B]] =
      f.map(fun { (p: Rep[A => B]) => p.encode })
  }

  class ClientDiscreteBehavior[+A: Manifest] private[ClientFRPLib] (
    override val rep: Rep[ScalaJs[DiscreteBehavior[A]]],
    override val core: ReplicationCore
  ) extends ClientBehavior[A](rep, core) {
    def changes(): ClientEvent[A] = ClientEvent(rep.changes(), core)

    def discreteReverseApply[B: Manifest, AA >: A: Manifest](fb: ClientDiscreteBehavior[A => B]): ClientDiscreteBehavior[B] = {
      val fbB = ClientDiscreteBehavior.toBoxedFuns(fb)
      ClientDiscreteBehavior(
        rep.discreteReverseApply(fbB.rep),
        fbB.core + core
      )
    }

    def withDeltas[DeltaA: Manifest, AA >: A: Manifest](init: Rep[AA], deltas: ClientEvent[DeltaA]): ClientIncBehavior[AA, DeltaA] =
      ClientIncBehavior(rep.withDeltas(init, deltas.rep), deltas.core + core)

    override def map[B: Manifest](f: Rep[A => B]): ClientDiscreteBehavior[B] =
      ClientDiscreteBehavior(rep.map(f.encode), core)
  }

  object ClientIncBehavior {
    def apply[D: Manifest, T: Manifest](rep: Rep[ScalaJs[IncrementalBehavior[D, T]]], core: ReplicationCore): ClientIncBehavior[D, T] =
      new ClientIncBehavior(rep, core)
  }

  class ClientIncBehavior[+A: Manifest, +DeltaA: Manifest] private (
    override val rep: Rep[ScalaJs[IncrementalBehavior[A, DeltaA]]],
    override val core: ReplicationCore
  ) extends ClientDiscreteBehavior[A](rep, core) {
    def deltas: ClientEvent[DeltaA] = ClientEvent(rep.deltas, core)
  }
}
