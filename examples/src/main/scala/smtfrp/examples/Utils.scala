package smtfrp.examples

import mtfrp.lang._

trait Utils { MtFrpProg =>
  sealed trait Diff[T]

  private[this] object Incrementalize {
    case class RemoveFront[T](x: T) extends Diff[T]
    case class Append[T](x: T) extends Diff[T]

    def getRemoves[T](left: List[T], right: List[T], diff: List[Diff[T]]): List[Diff[T]] = (left, right) match {
      case (Nil, ys) => ys.map(Append(_)) ++ diff
      case (xs, Nil) => xs.map(RemoveFront(_)) ++ diff
      case (x :: xs, y :: ys) =>
        if (x == y) getRemoves(xs, ys, diff)
        else getRemoves(xs, right, RemoveFront(x) :: diff)
    }
  }
  def differ[T](a: List[T], b: List[T]): List[Diff[T]] =
    Incrementalize.getRemoves(a, b, Nil)
}