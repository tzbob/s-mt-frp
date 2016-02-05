package mtfrp.lang

import hokko.core.{ Behavior => HBehavior, Event => HEvent }
import shapeless._
import shapeless.UnaryTCConstraint
import shapeless.ops.hlist.{ Selector => ShSelector }
import slick.dbio.DBIO

trait MtFrpDbRunner extends MtFrpProgRunner {
  override def serverExitEvents: Seq[HEvent[_]] = super.serverExitEvents
  override def serverExitBehaviors: Seq[HBehavior[_]] = super.serverExitBehaviors

  class Effects[L <: HList](l0: => L)(implicit ev: UnaryTCConstraint[L, Task]) {
    lazy val l = l0
    type List = L
    val cache = collection.mutable.Map.empty[Any, Any]
    def run[T](ev: HEvent[DBIO[T]])(implicit selector: ShSelector[List, Task[ev.type]]): HEvent[T] = {
      val event = l.select[Task[ev.type]].ev
      cache.getOrElseUpdate(event, HEvent.source[T]).asInstanceOf[HEvent[T]]
    }
  }

  class Task[T](val ev: T)

  object Task {
    implicit def apply[T](ev: HEvent[DBIO[T]]): Task[ev.type] = new Task(ev)
  }

  val effects: Effects[_ <: HList]

  def run[T](ev: HEvent[DBIO[T]])(implicit selector: ShSelector[effects.List, Task[ev.type]]): HEvent[T] =
    effects.run(ev)(selector)
}
