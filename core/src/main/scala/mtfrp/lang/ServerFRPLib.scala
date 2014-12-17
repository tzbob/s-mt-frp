package mtfrp.lang

import frp.core._
import frp.core.{ Event => SEvent }
import scala.annotation.implicitNotFound

trait ServerFRPLib extends ReplicationCoreLib {
  object ServerEvent {
    def apply[T](rep: SEvent[T], core: ReplicationCore): ServerEvent[T] =
      new ServerEvent(rep, core)
  }

  class ServerEvent[+T] private (val rep: SEvent[T], val core: ReplicationCore) {
    def map[A](modifier: T => A): ServerEvent[A] =
      ServerEvent(rep.map(modifier), core)

    def or[A >: T](that: ServerEvent[A]): ServerEvent[A] =
      ServerEvent(rep or that.rep, core.combine(that.core))

    def filter(pred: T => Boolean): ServerEvent[T] =
      ServerEvent(rep filter pred, core)

    def hold[U >: T](initial: U): ServerBehavior[U] =
      ServerBehavior(rep.hold(initial), core)

    def fold[A](start: A)(stepper: (A, T) => A): ServerBehavior[A] =
      ServerBehavior(rep.foldPast(start)(stepper), core)

    def incFold[B, D >: T](initial: B)(app: ServerDeltaApplicator[B, D]): ServerIncBehavior[D, B] =
      ServerIncBehavior(rep.incFoldPast(initial)(app), core)

    def combine[B, C](other: ServerBehavior[B])(combinator: (T, B) => C): ServerEvent[C] =
      ServerEvent(rep.combine(other.rep)(combinator), core.combine(other.core))

    def combine2[B, C, D](one: ServerBehavior[B], two: ServerBehavior[C])(combinator: (T, B, C) => D): ServerEvent[D] =
      ServerEvent(rep.combine2(one.rep, two.rep)(combinator), core.combine(one.core, two.core))
  }

  @implicitNotFound(msg = "Could not find an applicator for delta ${D}.")
  trait ServerDeltaApplicator[A, -D] extends DeltaApplicator[A, D] with Serializable

  object ServerBehavior {
    def apply[T](rep: Behavior[T], core: ReplicationCore) =
      new ServerBehavior(rep, core)
    def constant[T](const: T): ServerBehavior[T] =
      this.apply(Behavior.constant(const), ReplicationCore())
  }

  class ServerBehavior[+T] private[ServerFRPLib] (
    val rep: Behavior[T],
    val core: ReplicationCore) {

    def delay: ServerEvent[T] = ServerEvent(rep.delay, core)

    def changes: ServerEvent[T] = ServerEvent(rep.changes, core)

    def map[A](modifier: T => A): ServerBehavior[A] =
      ServerBehavior(rep map modifier, core)

    def sampledBy(event: ServerEvent[_]): ServerEvent[T] = {
      val newCore = core.combine(event.core)
      ServerEvent(rep.sampledBy(event.rep), newCore)
    }

    def combine[A, B](that: ServerBehavior[A])(f: (T, A) => B): ServerBehavior[B] = {
      val behavior = rep.combine(that.rep)(f)
      ServerBehavior(behavior, core.combine(that.core))
    }

    def combine2[A, B, C](one: ServerBehavior[A], two: ServerBehavior[B])(f: (T, A, B) => C): ServerBehavior[C] = {
      val behavior = rep.combine2(one.rep, two.rep)(f)
      ServerBehavior(behavior, core.combine(one.core, two.core))
    }

    def incrementalize[D, B >: T](differ: (B, B) => D): ServerIncBehavior[D, B] =
      ServerIncBehavior(rep.incrementalize(differ), core)
  }

  object ServerIncBehavior {
    def apply[D, T](rep: IncBehavior[D, T], core: ReplicationCore): ServerIncBehavior[D, T] =
      new ServerIncBehavior(rep, core)
  }

  class ServerIncBehavior[+D, T] private (
    override val rep: IncBehavior[D, T],
    override val core: ReplicationCore) extends ServerBehavior[T](rep, core) {
    def increments: ServerEvent[D] = ServerEvent(rep.increments, core)
  }
}
