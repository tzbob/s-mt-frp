package mtfrp.lang

import hokko.core.{Behavior, DiscreteBehavior, Event => HEvent, IncrementalBehavior}
import scala.annotation.implicitNotFound

trait ServerFRPLib extends ReplicationCoreLib { selfLib =>

  val clientEvents: ApplicationEvent[ClientStatus] =
    ApplicationEvent(rawClientEventSource, ReplicationCore.empty)

  val clientStatus: ApplicationIncBehavior[Set[Client], ClientStatus] =
    clientEvents.fold(Set.empty[Client]) { (set, newStatus) =>
      newStatus match {
        // TODO: Can it be that we are 'created' after a 'disconnected'?
        case Disconnected(c) => set - c
        case status => set + status.client
      }
    }

  object ApplicationEvent {
    def apply[T](rep: HEvent[T], core: ReplicationCore): ApplicationEvent[T] =
      new ApplicationEvent(rep, core)

    def merge[A](events: ApplicationEvent[A]*): ApplicationEvent[Seq[A]] = {
      val hokkoEvents = events.map(_.rep)
      val hokkoMerge = HEvent.merge(hokkoEvents)
      ApplicationEvent(hokkoMerge, ReplicationCore.merge(events.map(_.core)))
    }
  }

  class ApplicationEvent[+T] private (
    val rep: HEvent[T],
    val core: ReplicationCore
  ) {
    def fold[B, AA >: T](initial: B)(f: (B, AA) => B): ApplicationIncBehavior[B, AA] =
      ApplicationIncBehavior(rep.fold(initial)(f), core)

    def unionWith[B, C, AA >: T](b: ApplicationEvent[B])(f1: AA => C)(f2: B => C)(f3: (AA, B) => C): ApplicationEvent[C] =
      ApplicationEvent(rep.unionWith(b.rep)(f1)(f2)(f3), core + b.core)

    def collect[B, AA >: T](fb: T => Option[B]): ApplicationEvent[B] =
      ApplicationEvent(rep.collect(fb), core)

    // Derived ops

    def hold[U >: T](initial: U): ApplicationDiscreteBehavior[U] =
      ApplicationDiscreteBehavior(rep.hold(initial), core)

    def map[A](modifier: T => A): ApplicationEvent[A] =
      ApplicationEvent(rep.map(modifier), core)

    def dropIf(pred: T => Boolean): ApplicationEvent[T] =
      ApplicationEvent(rep.dropIf(pred), core)
  }

  object ApplicationBehavior {
    def apply[T](rep: Behavior[T], core: ReplicationCore) =
      new ApplicationBehavior(rep, core)
    def constant[T](const: T): ApplicationBehavior[T] =
      this.apply(Behavior.constant(const), ReplicationCore.empty)
  }

  class ApplicationBehavior[+A] private[ServerFRPLib] (
    val rep: Behavior[A],
    val core: ReplicationCore
  ) {
    def reverseApply[B, AA >: A](fb: ApplicationBehavior[AA => B]): ApplicationBehavior[B] =
      ApplicationBehavior(rep.reverseApply(fb.rep), core + fb.core)

    def snapshotWith[B, AA >: A](ev: ApplicationEvent[AA => B]): ApplicationEvent[B] =
      ApplicationEvent(rep.snapshotWith(ev.rep), core + ev.core)

    // Derived ops

    def map[B](f: A => B): ApplicationBehavior[B] = ApplicationBehavior(rep.map(f), core)

    def map2[B, C](b: ApplicationBehavior[B])(f: (A, B) => C): ApplicationBehavior[C] =
      ApplicationBehavior(rep.map2(b.rep)(f), core + b.core)

    def map3[B, C, D](b: ApplicationBehavior[B], c: ApplicationBehavior[C])(f: (A, B, C) => D): ApplicationBehavior[D] =
      ApplicationBehavior(rep.map3(b.rep, c.rep)(f), core + b.core + c.core)
  }

  object ApplicationDiscreteBehavior {
    def apply[T](rep: DiscreteBehavior[T], core: ReplicationCore): ApplicationDiscreteBehavior[T] =
      new ApplicationDiscreteBehavior(rep, core)
    def constant[T](const: T): ApplicationDiscreteBehavior[T] =
      this.apply(DiscreteBehavior.constant(const), ReplicationCore.empty)
  }

  class ApplicationDiscreteBehavior[+A] private[ServerFRPLib] (
    override val rep: DiscreteBehavior[A],
    override val core: ReplicationCore
  ) extends ApplicationBehavior[A](rep, core) {
    def changes(): ApplicationEvent[A] = ApplicationEvent(rep.changes(), core)

    def discreteReverseApply[B, AA >: A](fb: ApplicationDiscreteBehavior[A => B]): ApplicationDiscreteBehavior[B] =
      ApplicationDiscreteBehavior(rep.discreteReverseApply(fb.rep), fb.core + core)

    def withDeltas[DeltaA, AA >: A](init: AA, deltas: ApplicationEvent[DeltaA]): ApplicationIncBehavior[AA, DeltaA] =
      ApplicationIncBehavior(rep.withDeltas(init, deltas.rep), deltas.core + core)

    override def map[B](f: A => B): ApplicationDiscreteBehavior[B] =
      ApplicationDiscreteBehavior(rep.map(f), core)

    def discreteMap2[B, C](b: ApplicationDiscreteBehavior[B])(f: (A, B) => C): ApplicationDiscreteBehavior[C] =
      ApplicationDiscreteBehavior(rep.discreteMap2(b.rep)(f), core + b.core)

    def discreteMap3[B, C, D](b: ApplicationDiscreteBehavior[B], c: ApplicationDiscreteBehavior[C])(f: (A, B, C) => D): ApplicationDiscreteBehavior[D] =
      ApplicationDiscreteBehavior(rep.discreteMap3(b.rep, c.rep)(f), core + b.core + c.core)
  }

  object ApplicationIncBehavior {
    def apply[D, T](rep: IncrementalBehavior[D, T], core: ReplicationCore): ApplicationIncBehavior[D, T] =
      new ApplicationIncBehavior(rep, core)
  }

  class ApplicationIncBehavior[+A, +DeltaA] private (
    override val rep: IncrementalBehavior[A, DeltaA],
    override val core: ReplicationCore
  ) extends ApplicationDiscreteBehavior[A](rep, core) {
    def deltas: ApplicationEvent[DeltaA] = ApplicationEvent(rep.deltas, core)
  }
}
