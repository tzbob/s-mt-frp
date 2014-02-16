package mtfrp.gen

import scala.js.gen.js.GenBase
import mtfrp.exp.DelayedEvalExp

trait GenDelayedEval extends GenBase {
  val IR: DelayedEvalExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case DelayedEval(thunk) => emitValDef(sym, quote(thunk()))
    case _                  => super.emitNode(sym, rhs)
  }
}