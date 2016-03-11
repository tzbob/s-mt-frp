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
    def apply[T: Manifest](rep: Rep[ScalaJs[HEvent[T]]], core: ReplicationCore): ClientEvent[T] =
      new ClientEvent(rep, core)

    def merge[A: Manifest](events: ClientEvent[A]*): ClientEvent[ScalaJs[Seq[A]]] = {
      val hokkoParams = events.map(_.rep)
      val hokkoSeqEvents = ScalaJsRuntime.encodeListAsSeq(List(hokkoParams: _*))
      val hokkoMerge = EventRep.merge(hokkoSeqEvents)
      ClientEvent(hokkoMerge, ReplicationCore.merge(events.map(_.core)))
    }

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientEvent[A => B]): ClientEvent[ScalaJs[A => B]] =
      f.map { (p: Rep[A => B]) => ScalaJsRuntime.encodeFn1(p) }
  }

  class ClientEvent[+T: Manifest] private (
    val rep: Rep[ScalaJs[HEvent[T]]],
    val core: ReplicationCore
  ) {
    def fold[B: Manifest, AA >: T: Manifest](initial: Rep[B])(f: (Rep[B], Rep[AA]) => Rep[B]): ClientIncBehavior[B, AA] =
      ClientIncBehavior(rep.fold(initial)(ScalaJsRuntime.encodeFn2(fun(f))), core)

    def unionWith[B: Manifest, C: Manifest, AA >: T: Manifest](b: ClientEvent[B])(f1: Rep[AA] => Rep[C])(f2: Rep[B] => Rep[C])(f3: (Rep[AA], Rep[B]) => Rep[C]): ClientEvent[C] =
      ClientEvent(rep.unionWith(b.rep)(ScalaJsRuntime.encodeFn1(fun(f1)))(ScalaJsRuntime.encodeFn1(fun(f2)))(ScalaJsRuntime.encodeFn2(fun(f3))), core + b.core)

    def collect[B: Manifest, AA >: T: Manifest](fb: Rep[T] => Rep[Option[B]]): ClientEvent[B] = {
      val scalaJsFun = ScalaJsRuntime.encodeFn1(fun { (p: Rep[T]) =>
        ScalaJsRuntime.encodeOptions(fb(p))
      })
      ClientEvent(rep.collect(scalaJsFun), core)
    }

    // Derived ops

    def hold[U >: T: Manifest](initial: Rep[U]): ClientDiscreteBehavior[U] =
      ClientDiscreteBehavior(rep.hold(initial), core)

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientEvent[A] =
      ClientEvent(rep.map(ScalaJsRuntime.encodeFn1(modifier)), core)

    def dropIf(pred: Rep[T => Boolean]): ClientEvent[T] =
      ClientEvent(rep.dropIf(ScalaJsRuntime.encodeFn1(pred)), core)
  }

  object ClientBehavior {
    def apply[T: Manifest](rep: Rep[ScalaJs[Behavior[T]]], core: ReplicationCore) =
      new ClientBehavior(rep, core)
    def constant[T: Manifest](const: Rep[T]): ClientBehavior[T] =
      this.apply(BehaviorRep.constant(const), ReplicationCore.empty)

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientBehavior[A => B]): ClientBehavior[ScalaJs[A => B]] =
      f.map { (p: Rep[A => B]) => ScalaJsRuntime.encodeFn1(p) }
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

    // Derived ops

    def map[B: Manifest](f: Rep[A] => Rep[B]): ClientBehavior[B] =
      ClientBehavior(rep.map(ScalaJsRuntime.encodeFn1(f)), core)

    def map2[B: Manifest, C: Manifest](b: ClientBehavior[B])(f: (Rep[A], Rep[B]) => Rep[C]): ClientBehavior[C] =
      ClientBehavior(rep.map2(b.rep)(ScalaJsRuntime.encodeFn2(f)), core + b.core)

    def map3[B: Manifest, C: Manifest, D: Manifest](b: ClientBehavior[B], c: ClientBehavior[C])(f: (Rep[A], Rep[B], Rep[C]) => Rep[D]): ClientBehavior[D] =
      ClientBehavior(rep.map3(b.rep, c.rep)(ScalaJsRuntime.encodeFn3(f)), core + b.core + c.core)

    def sampledWith[B: Manifest, C: Manifest](ev: ClientEvent[B])(f: (Rep[A], Rep[B]) => Rep[C]): ClientEvent[C] = {
      val evB = ev.map { b: Rep[B] => a: Rep[A] => f(a, b) }
      this.snapshotWith(evB)
    }

    def sampledBy(ev: ClientEvent[_]): ClientEvent[A] =
      ClientEvent(rep.sampledBy(ev.rep), core + ev.core)
  }

  object ClientDiscreteBehavior {
    def apply[T: Manifest](rep: Rep[ScalaJs[DiscreteBehavior[T]]], core: ReplicationCore): ClientDiscreteBehavior[T] =
      new ClientDiscreteBehavior(rep, core)
    def constant[T: Manifest](const: Rep[T]): ClientDiscreteBehavior[T] =
      this.apply(DiscreteBehaviorRep.constant(const), ReplicationCore.empty)

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientDiscreteBehavior[A => B]): ClientDiscreteBehavior[ScalaJs[A => B]] =
      f.map { (p: Rep[A => B]) => ScalaJsRuntime.encodeFn1(p) }
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

    override def map[B: Manifest](f: Rep[A] => Rep[B]): ClientDiscreteBehavior[B] =
      ClientDiscreteBehavior(rep.map(ScalaJsRuntime.encodeFn1(f)), core)

    def discreteMap2[B: Manifest, C: Manifest](b: ClientDiscreteBehavior[B])(f: (Rep[A], Rep[B]) => Rep[C]): ClientDiscreteBehavior[C] =
      ClientDiscreteBehavior(rep.discreteMap2(b.rep)(ScalaJsRuntime.encodeFn2(f)), core + b.core)

    def discreteMap3[B: Manifest, C: Manifest, D: Manifest](b: ClientDiscreteBehavior[B], c: ClientDiscreteBehavior[C])(f: (Rep[A], Rep[B], Rep[C]) => Rep[D]): ClientDiscreteBehavior[D] =
      ClientDiscreteBehavior(rep.discreteMap3(b.rep, c.rep)(ScalaJsRuntime.encodeFn3(f)), core + b.core)
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

    def map[B: Manifest, DeltaB: Manifest](accumulator: (Rep[B], Rep[DeltaB]) => Rep[B])(fa: Rep[A] => Rep[B])(fb: Rep[DeltaA] => Rep[DeltaB]) =
      ClientIncBehavior(rep.map(ScalaJsRuntime.encodeFn2(accumulator))(ScalaJsRuntime.encodeFn1(fa))(ScalaJsRuntime.encodeFn1(fb)), core)
  }
}
