package mtfrp.gen

import scala.js.gen.js.GenBase
import mtfrp.exp.DelayedEvalExp
import mtfrp.lang.Client
import java.io.PrintWriter

trait GenDelayedEval extends GenBase {
  val IR: DelayedEvalExp
  import IR._

  var client: Client = _

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case DelayedForClient(thunk) => emitValDef(sym, quote(thunk(client)))
    case _ => super.emitNode(sym, rhs)
  }

  def emitSourceForClient[A: Manifest](client: Client, args: List[Sym[_]], body: Block[A], name: String, out: PrintWriter) = {
    this.client = client
    this.emitSource(args, body, name, out)
  }
}