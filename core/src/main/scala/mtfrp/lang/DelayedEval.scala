package mtfrp.lang

import scala.virtualization.lms.common.Base

trait DelayedEval extends Base {

  def delayEval[T: Manifest](thunk: () => Rep[T]): Rep[T]

}