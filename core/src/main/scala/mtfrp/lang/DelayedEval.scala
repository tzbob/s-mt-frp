package mtfrp.lang

import scala.virtualization.lms.common.Base

trait DelayedEval extends Base {

  def delayForClient[T: Manifest](thunk: Client => Rep[T]): Rep[T]

}