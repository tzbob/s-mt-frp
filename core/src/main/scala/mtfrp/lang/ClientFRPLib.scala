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
      val hokkoSeqEvents = ScalaJsRuntime.encodeListAsSeq(List(hokkoParams: _*))
      val hokkoMerge = EventRep.merge(hokkoSeqEvents)
      ClientEvent(hokkoMerge, ReplicationCore.merge(events.map(_.core)))
    }

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientEvent[A => B]): ClientEvent[ScalaJs[A => B]] =
      f.map(fun { (p: Rep[A => B]) => ScalaJsRuntime.encodeFn1(p) })
  }

  class ClientEvent[+T: Manifest] private (
    val rep: Rep[ScalaJs[HEvent[T]]],
    val core: ReplicationCore
  ) {
    def fold[B: Manifest, AA >: T: Manifest](initial: Rep[B])(f: (Rep[B], Rep[AA]) => Rep[B]): ClientIncBehavior[B, AA] =
      ClientIncBehavior(rep.fold(initial)(ScalaJsRuntime.encodeFn2(fun(f))), core)

    def unionWith[B: Manifest, C: Manifest, AA >: T: Manifest](b: ClientEvent[B])(f1: Rep[AA] => Rep[C])(f2: Rep[B] => Rep[C])(f3: (Rep[AA], Rep[B]) => Rep[C]): ClientEvent[C] =
      ClientEvent(rep.unionWith(b.rep)(ScalaJsRuntime.encodeFn1(fun(f1)))(ScalaJsRuntime.encodeFn1(fun(f2)))(ScalaJsRuntime.encodeFn2(fun(f3))), core + b.core)

    def collect[B: Manifest, AA >: T: Manifest](fb: Rep[T => Option[B]]): ClientEvent[B] = {
      val scalaJsFun = ScalaJsRuntime.encodeFn1(fun { (p: Rep[T]) =>
        ScalaJsRuntime.encodeOptions(fb(p))
      })
      ClientEvent(rep.collect(scalaJsFun), core)
    }

    // Derived ops

    def hold[U >: T: Manifest](initial: Rep[U]): ClientDiscreteBehavior[U] =
      ClientDiscreteBehavior(rep.hold(initial), core)

    def map[A: Manifest](modifier: Rep[T => A]): ClientEvent[A] =
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
      f.map(fun { (p: Rep[A => B]) => ScalaJsRuntime.encodeFn1(p) })
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
      ClientBehavior(rep.map(ScalaJsRuntime.encodeFn1(f)), core)

    def markChanges(marks: ClientEvent[Unit]): ClientDiscreteBehavior[A] =
      ClientDiscreteBehavior(rep.markChanges(marks.rep), core + marks.core)

    def sampledBy(ev: ClientEvent[_]): ClientEvent[A] =
      ClientEvent(rep.sampledBy(ev.rep), core + ev.core)
  }

  object ClientDiscreteBehavior {
    def apply[T: Manifest](rep: Rep[ScalaJs[DiscreteBehavior[T]]], core: ReplicationCore): ClientDiscreteBehavior[T] =
      new ClientDiscreteBehavior(rep, core)
    def constant[T: Manifest](const: Rep[T]): ClientDiscreteBehavior[T] =
      this.apply(DiscreteBehaviorRep.constant(const), ReplicationCore.empty)

    def toBoxedFuns[A: Manifest, B: Manifest](f: ClientDiscreteBehavior[A => B]): ClientDiscreteBehavior[ScalaJs[A => B]] =
      f.map(fun { (p: Rep[A => B]) => ScalaJsRuntime.encodeFn1(p) })
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
      ClientDiscreteBehavior(rep.map(ScalaJsRuntime.encodeFn1(f)), core)
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

    def map[B: Manifest, DeltaB: Manifest](accumulator: Rep[((B, DeltaB)) => B])(fa: Rep[A => B])(fb: Rep[DeltaA => DeltaB]) =
      ClientIncBehavior(rep.map(ScalaJsRuntime.encodeFn2(accumulator))(ScalaJsRuntime.encodeFn1(fa))(ScalaJsRuntime.encodeFn1(fb)), core)
  }
}
