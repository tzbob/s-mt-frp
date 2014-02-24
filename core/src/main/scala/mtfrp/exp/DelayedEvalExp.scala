package mtfrp.exp

import scala.virtualization.lms.common.BaseExp
import mtfrp.lang.DelayedEval
import mtfrp.lang.Client

trait DelayedEvalExp extends DelayedEval with BaseExp {
  case class DelayedForClient[T](thunk: Client => Exp[T]) extends Def[T]
  def delayForClient[T: Manifest](thunk: Client => Exp[T]): Exp[T] =
    DelayedForClient(thunk)
}