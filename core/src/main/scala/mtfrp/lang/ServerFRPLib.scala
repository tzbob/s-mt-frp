package mtfrp.lang

import hokko.core.{ Behavior, DiscreteBehavior, Event => HEvent, IncrementalBehavior }
import scala.annotation.implicitNotFound

trait ServerFRPLib extends ReplicationCoreLib { selfLib =>
  object ServerEvent {
    def apply[T](rep: HEvent[T], core: ReplicationCore): ServerEvent[T] =
      new ServerEvent(rep, core)

    def merge[A](events: ServerEvent[A]*): ServerEvent[Seq[A]] = {
      val hokkoEvents = events.map(_.rep)
      val hokkoMerge = HEvent.merge(hokkoEvents)
      ServerEvent(hokkoMerge, ReplicationCore.merge(events.map(_.core)))
    }
  }

  class ServerEvent[+T] private (
    val rep: HEvent[T],
    val core: ReplicationCore
  ) {
    def fold[B, AA >: T](initial: B)(f: (B, AA) => B): ServerIncBehavior[B, AA] =
      ServerIncBehavior(rep.fold(initial)(f), core)

    def unionWith[B, C, AA >: T](b: ServerEvent[B])(f1: AA => C)(f2: B => C)(f3: (AA, B) => C): ServerEvent[C] =
      ServerEvent(rep.unionWith(b.rep)(f1)(f2)(f3), core + b.core)

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
    def apply[T](rep: Behavior[T], core: ReplicationCore) =
      new ServerBehavior(rep, core)
    def constant[T](const: T): ServerBehavior[T] =
      this.apply(Behavior.constant(const), ReplicationCore.empty)
  }

  class ServerBehavior[+A] private[ServerFRPLib] (
    val rep: Behavior[A],
    val core: ReplicationCore
  ) {
    def reverseApply[B, AA >: A](fb: ServerBehavior[AA => B]): ServerBehavior[B] =
      ServerBehavior(rep.reverseApply(fb.rep), core + fb.core)

    def snapshotWith[B, AA >: A](ev: ServerEvent[AA => B]): ServerEvent[B] =
      ServerEvent(rep.snapshotWith(ev.rep), core + ev.core)

    def withChanges[AA >: A](changes: ServerEvent[AA]): ServerDiscreteBehavior[AA] =
      ServerDiscreteBehavior(rep.withChanges(changes.rep), core + changes.core)

    // Derived ops

    def map[B](f: A => B): ServerBehavior[B] = ServerBehavior(rep.map(f), core)

    def markChanges(marks: ServerEvent[Unit]): ServerDiscreteBehavior[A] =
      ServerDiscreteBehavior(rep.markChanges(marks.rep), core + marks.core)
  }

  object ServerDiscreteBehavior {
    def apply[T](rep: DiscreteBehavior[T], core: ReplicationCore): ServerDiscreteBehavior[T] =
      new ServerDiscreteBehavior(rep, core)
  }

  class ServerDiscreteBehavior[+A] private[ServerFRPLib] (
    override val rep: DiscreteBehavior[A],
    override val core: ReplicationCore
  ) extends ServerBehavior[A](rep, core) {
    def changes(): ServerEvent[A] = ServerEvent(rep.changes(), core)

    def discreteReverseApply[B, AA >: A](fb: ServerDiscreteBehavior[A => B]): ServerDiscreteBehavior[B] =
      ServerDiscreteBehavior(rep.discreteReverseApply(fb.rep), fb.core + core)

    def withDeltas[DeltaA, AA >: A](init: AA, deltas: ServerEvent[DeltaA]): ServerIncBehavior[AA, DeltaA] =
      ServerIncBehavior(rep.withDeltas(init, deltas.rep), deltas.core + core)

    override def map[B](f: A => B): ServerDiscreteBehavior[B] =
      ServerDiscreteBehavior(rep.map(f), core)
  }

  object ServerIncBehavior {
    def apply[D, T](rep: IncrementalBehavior[D, T], core: ReplicationCore): ServerIncBehavior[D, T] =
      new ServerIncBehavior(rep, core)
  }

  class ServerIncBehavior[+A, +DeltaA] private (
    override val rep: IncrementalBehavior[A, DeltaA],
    override val core: ReplicationCore
  ) extends ServerDiscreteBehavior[A](rep, core) {
    def deltas: ServerEvent[DeltaA] = ServerEvent(rep.deltas, core)
  }
}
