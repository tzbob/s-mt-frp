package smtfrp.examples

import mtfrp.lang._
import spray.json.JsonFormat
import scala.js.exp.FFIExp

trait Utils { self: MtFrpProg with FFIExp =>
  case class StringListDiff(remove: List[String], append: List[String]) extends Adt
  implicit val diffFormat = jsonFormat2(StringListDiff)

  private[this] object Incrementalize extends Serializable {
    implicit def diffOps(p: Rep[StringListDiff]) = adtOps(p)

    def getRemoves(left: List[String], right: List[String], diff: StringListDiff): StringListDiff =
      (left, right) match {
        case (Nil, ys) => diff.copy(append = ys ::: diff.append)
        case (xs, Nil) => diff.copy(remove = xs ::: diff.remove)
        case (x :: xs, y :: ys) =>
          if (x == y) getRemoves(xs, ys, diff)
          else getRemoves(xs, right, diff.copy(remove = x :: diff.remove))
      }

    def differ(a: List[String], b: List[String]): StringListDiff = getRemoves(a, b, StringListDiff(Nil, Nil))

    def reduce(a: Rep[List[String]], init: Rep[List[String]], reducer: Rep[((List[String], String)) => List[String]]): Rep[List[String]] =
      foreign"$a.reduce($reducer, $init)"[List[String]].withEffect()

    def removeFirstOcc(a: Rep[List[String]], occ: Rep[String]): Rep[List[String]] = {
      foreign"""(function(){ var idx = $a.indexOf($occ); $a.splice(idx, 1);})()""".withEffect()
      a
    }

    def stringPatch(b: Rep[List[String]], diff: Rep[StringListDiff]): Rep[List[String]] = {
      val trimmed = reduce(diff.remove, b, fun(removeFirstOcc _))
      trimmed ++ diff.append
    }
  }

  def serverDiffer(a: List[String], b: List[String]): StringListDiff =
    Incrementalize.getRemoves(a, b, StringListDiff(Nil, Nil))

  // def clientPatcher = new ClientDeltaApplicator[List[String], StringListDiff] {
  //   def apply(acc: Rep[List[String]], delta: Rep[StringListDiff]): Rep[List[String]] =
  //     Incrementalize.stringPatch(acc, delta)
  // }
}
