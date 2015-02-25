package mtfrp.lang

import hokko.core.Behavior
import hokko.core.Event
import hokko.core.DiscreteBehavior
import hokko.core.IncrementalBehavior
import scala.annotation.implicitNotFound

trait ServerFRPLib extends ReplicationCoreLib { selfLib =>
  object ServerEvent {
    def apply[T](rep: Event[T], core: Set[Dependency]): ServerEvent[T] =
      new ServerEvent(rep, core)

    def merge[A](events: ServerEvent[A]*): ServerEvent[Seq[A]] = {
      val hokkoEvents = events.map(_.rep)
      val hokkoMerge = Event.merge(hokkoEvents)
      ServerEvent(hokkoMerge, Set(events.map(_.core): _*).flatten)
    }
  }

  class ServerEvent[+T] private (val rep: Event[T], val core: Set[Dependency]) {
    def fold[B, AA >: T](initial: B)(f: (B, AA) => B): ServerIncBehavior[B, AA] =
      ServerIncBehavior(rep.fold(initial)(f), core)

    def unionWith[B, C, AA >: T](b: ServerEvent[B])(f1: AA => C)(f2: B => C)(f3: (AA, B) => C): ServerEvent[C] =
      ServerEvent(rep.unionWith(b.rep)(f1)(f2)(f3), core ++ b.core)

    def collect[B, AA >: T](fb: T => Option[B]): ServerEvent[B] =
      ServerEvent(rep.collect(fb), core)

    // Derived ops

    def hold[U >: T](initial: U): ServerBehavior[U] =
      ServerBehavior(rep.hold(initial), core)

    def map[A](modifier: T => A): ServerEvent[A] =
      ServerEvent(rep.map(modifier), core)

    def dropIf(pred: T => Boolean): ServerEvent[T] =
      ServerEvent(rep.dropIf(pred), core)
  }

  object ServerBehavior {
    def apply[T](rep: Behavior[T], core: Set[Dependency]) =
      new ServerBehavior(rep, core)
    def constant[T](const: T): ServerBehavior[T] =
      this.apply(Behavior.constant(const), Set.empty[Dependency])
  }

  class ServerBehavior[+A] private[ServerFRPLib] (val rep: Behavior[A], val core: Set[Dependency]) {
    def reverseApply[B, AA >: A](fb: ServerBehavior[AA => B]): ServerBehavior[B] =
      ServerBehavior(rep.reverseApply(fb.rep), core ++ fb.core)

    def snapshotWith[B, AA >: A](ev: ServerEvent[AA => B]): ServerEvent[B] =
      ServerEvent(rep.snapshotWith(ev.rep), core ++ ev.core)

    def withChanges[AA >: A](changes: ServerEvent[AA]): ServerDiscreteBehavior[AA] =
      ServerDiscreteBehavior(rep.withChanges(changes.rep), core ++ changes.core)

    // Derived ops

    def map[B](f: A => B): ServerBehavior[B] = ServerBehavior(rep.map(f), core)

    def markChanges(marks: ServerEvent[Unit]): ServerDiscreteBehavior[A] =
      ServerDiscreteBehavior(rep.markChanges(marks.rep), core ++ marks.core)
  }

  object ServerDiscreteBehavior {
    def apply[T](rep: DiscreteBehavior[T], core: Set[Dependency]): ServerDiscreteBehavior[T] =
      new ServerDiscreteBehavior(rep, core)
  }

  class ServerDiscreteBehavior[+A] private[ServerFRPLib] (
    val rep: DiscreteBehavior[A],
    val core: Set[Dependency]
  ) extends ServerBehavior[A](rep, core) {
    def changes(): ServerEvent[A] = ServerEvent(rep.changes(), core)

    def discreteReverseApply[B, AA >: A](fb: ServerDiscreteBehavior[A => B]): ServerDiscreteBehavior[B] =
      ServerDiscreteBehavior(rep.discreteReverseApply(fb.rep), fb.core ++ core)

    def withDeltas[DeltaA, AA >: A](init: AA, deltas: ServerEvent[DeltaA]): ServerIncBehavior[AA, DeltaA] =
      ServerIncBehavior(rep.withDeltas(init, deltas.rep), deltas.core ++ core)

    override def map[B](f: A => B): ServerDiscreteBehavior[B] =
      ServerDiscreteBehavior(rep.map(f), core)
  }

  object ServerIncBehavior {
    def apply[D, T](rep: IncrementalBehavior[D, T], core: Set[Dependency]): ServerIncBehavior[D, T] =
      new ServerIncBehavior(rep, core)
  }

  class ServerIncBehavior[+A, +DeltaA] private (
    val rep: IncrementalBehavior[A, DeltaA],
    val core: Set[Dependency]
  ) extends ServerBehavior[A](rep, core) {
    def deltas: ServerEvent[DeltaA] = ServerEvent(rep.deltas, core)
  }
}
