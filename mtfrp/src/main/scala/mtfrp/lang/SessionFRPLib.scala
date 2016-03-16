package mtfrp.lang

sealed trait Increment[+DeltaA, +DeltaB]
case class Left[DeltaA](da: DeltaA) extends Increment[DeltaA, Nothing]
case class Right[DeltaB](db: DeltaB) extends Increment[Nothing, DeltaB]
case class All[DeltaA, DeltaB](da: DeltaA, db: DeltaB) extends Increment[DeltaA, DeltaB]

trait SessionFRPLib extends ServerFRPLib {

  object SessionEvent {
    def apply[T](wrappee: ApplicationEvent[Client => Option[T]]): SessionEvent[T] =
      new SessionEvent(wrappee)

    def merge[A](events: SessionEvent[A]*): SessionEvent[Seq[A]] = {
      val evts = events.map(_.rep)
      val merged = ApplicationEvent.merge(evts: _*)

      val mergedSessionEvents = merged.map { seq => c: Client =>
        val actualPulses = seq.map { clientFun => clientFun(c) }.flatten
        if (actualPulses.isEmpty) None
        else Some(actualPulses)
      }

      SessionEvent(mergedSessionEvents)
    }
  }

  class SessionEvent[+T] private (val rep: ApplicationEvent[Client => Option[T]]) {
    def fold[B, AA >: T](initial: B)(f: (B, AA) => B): SessionIncBehavior[B, AA] = {

      val newRep = rep.fold { _: Client => initial } { (stateFun, newEvent) => c: Client =>
        val state = stateFun(c)
        newEvent(c) match {
          case Some(pulse) => f(state, pulse)
          case None => state
        }
      }

      SessionIncBehavior(initial, newRep)
    }

    def unionWith[B, C, AA >: T](b: SessionEvent[B])(f1: AA => C)(f2: B => C)(f3: (AA, B) => C): SessionEvent[C] = {
      val newRep = rep.unionWith(b.rep) { clientFun => c: Client =>
        clientFun(c).map(f1)
      } { clientFun => c: Client =>
        clientFun(c).map(f2)
      } { (aaClientFun, bClientFun) => c: Client =>
        (aaClientFun(c), bClientFun(c)) match {
          case (None, _) => None
          case (_, None) => None
          case (Some(aa), Some(b)) => Some(f3(aa, b))
          case _ => sys.error("Can't happen, unionWith f3 no events")
        }
      }

      SessionEvent(newRep)
    }

    def collect[B, AA >: T](fb: T => Option[B]): SessionEvent[B] = {
      val newRep = rep.collect { clientFun =>
        // TODO: this always fires an update even if there wasn't actually any work to be done for any clients
        Some { c: Client => clientFun(c).flatMap(fb) }
      }

      SessionEvent(newRep)
    }

    // Derived ops

    def hold[U >: T](initial: U): SessionDiscreteBehavior[U] =
      this.fold(initial) { (_, x) => x }

    def map[A](modifier: T => A): SessionEvent[A] =
      this.collect(modifier andThen Some.apply)

    def dropIf(pred: T => Boolean): SessionEvent[T] =
      this.collect { t => if (pred(t)) Some(t) else None }
  }

  object SessionBehavior {
    def apply[T](rep: ApplicationBehavior[Client => T]) =
      new SessionBehavior(rep)

    def constant[T](const: T): SessionBehavior[T] =
      SessionBehavior(ApplicationBehavior.constant(_ => const))
  }

  class SessionBehavior[+A] private[SessionFRPLib] (val rep: ApplicationBehavior[Client => A]) {
    def reverseApply[B, AA >: A](fb: SessionBehavior[AA => B]): SessionBehavior[B] = {
      val newFb = fb.rep.map { f => cf: (Client => A) =>
        c: Client =>
          f(c)(cf(c))
      }
      val fbNew = rep.reverseApply(newFb)
      SessionBehavior(fbNew)
    }

    def snapshotWith[B, AA >: A](ev: SessionEvent[AA => B]): SessionEvent[B] = {
      val newRep = rep.sampledWith(ev.rep) { (clientFun, partialClientFun) => c: Client =>
        partialClientFun(c).map(_(clientFun(c)))
      }

      SessionEvent(newRep)
    }

    // Derived ops

    def map[B](f: A => B): SessionBehavior[B] = this.reverseApply(SessionBehavior.constant(f))

    def map2[B, C](b: SessionBehavior[B])(f: (A, B) => C): SessionBehavior[C] =
      b.reverseApply(this.reverseApply(SessionBehavior.constant(f.curried)))

    def map3[B, C, D](b: SessionBehavior[B], c: SessionBehavior[C])(f: (A, B, C) => D): SessionBehavior[D] =
      c.reverseApply(b.reverseApply(this.reverseApply(SessionBehavior.constant(f.curried))))

    def sampledWith[B, C](ev: SessionEvent[B])(f: (A, B) => C): SessionEvent[C] = {
      val evB = ev.map { b: B => a: A => f(a, b) }
      this.snapshotWith(evB)
    }
  }

  object SessionDiscreteBehavior {
    def apply[T](rep: ApplicationDiscreteBehavior[Client => T]): SessionDiscreteBehavior[T] =
      new SessionDiscreteBehavior(rep)

    def constant[T](const: T): SessionDiscreteBehavior[T] =
      this.apply(ApplicationDiscreteBehavior.constant(_ => const))
  }

  class SessionDiscreteBehavior[+A] private[SessionFRPLib] (override val rep: ApplicationDiscreteBehavior[Client => A])
    extends SessionBehavior[A](rep) {

    def changes(): SessionEvent[A] = SessionEvent(rep.changes().map(_ andThen Some.apply))

    def discreteReverseApply[B, AA >: A](fb: SessionDiscreteBehavior[A => B]): SessionDiscreteBehavior[B] = {
      val newFb = fb.rep.map { f => cf: (Client => A) =>
        c: Client =>
          f(c)(cf(c))
      }
      val fbNew = rep.discreteReverseApply(newFb)
      SessionDiscreteBehavior(fbNew)
    }

    def withDeltas[DeltaA, AA >: A](init: AA, deltas: SessionEvent[DeltaA]): SessionIncBehavior[AA, DeltaA] =
      SessionIncBehavior(init, rep.withDeltas(_ => init, deltas.rep))

    override def map[B](f: A => B): SessionDiscreteBehavior[B] =
      this.discreteReverseApply(SessionDiscreteBehavior.constant(f))

    def discreteMap2[B, C](b: SessionDiscreteBehavior[B])(f: (A, B) => C): SessionDiscreteBehavior[C] =
      b.discreteReverseApply(this.discreteReverseApply(SessionDiscreteBehavior.constant(f.curried)))

    def discreteMap3[B, C, D](b: SessionDiscreteBehavior[B], c: SessionDiscreteBehavior[C])(f: (A, B, C) => D): SessionDiscreteBehavior[D] =
      c.discreteReverseApply(b
        .discreteReverseApply(this.discreteReverseApply(SessionDiscreteBehavior.constant(f.curried))))
  }

  object SessionIncBehavior {
    def apply[T, DeltaT](init: T, rep: ApplicationIncBehavior[Client => T, Client => Option[DeltaT]]): SessionIncBehavior[T, DeltaT] =
      new SessionIncBehavior(init, rep)
  }

  class SessionIncBehavior[+A, +DeltaA] private (
    val init: A,
    override val rep: ApplicationIncBehavior[Client => A, Client => Option[DeltaA]]
  ) extends SessionDiscreteBehavior[A](rep) {
    def deltas: SessionEvent[DeltaA] = SessionEvent(rep.deltas)

    def incMap2[B, DeltaB, C, DeltaC](b: SessionIncBehavior[B, DeltaB])(
      valueFun: (A, B) => C
    )(
      deltaFun: (A, B, Increment[DeltaA, DeltaB]) => Option[DeltaC]
    )(
      foldFun: (C, DeltaC) => C
    ): SessionIncBehavior[C, DeltaC] = {

      val newInit = valueFun(init, b.init)

      val newDelta: SessionEvent[DeltaC] = {
        val abs = this.discreteMap2(b) { (_, _) }
        val increments = this.deltas.unionWith(b.deltas)(Left(_): Increment[DeltaA, DeltaB])(Right(_))(All(_, _))
        val tupled = abs.sampledWith(increments) {
          case ((a, b), inc) => (a, b, inc)
        }
        tupled.collect(deltaFun.tupled)
      }

      newDelta.fold(newInit)(foldFun)
    }
  }

}
