package mtfrp.exp

import scala.virtualization.lms.common.BaseExp
import mtfrp.lang.DelayedEval

trait DelayedEvalExp extends DelayedEval with BaseExp {
  case class DelayedEval[T](thunk: () => Exp[T]) extends Def[T]
  def delayEval[T: Manifest](thunk: () => Exp[T]): Exp[T] = DelayedEval(thunk)
}