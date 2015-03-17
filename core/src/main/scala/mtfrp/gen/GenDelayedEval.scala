package mtfrp.gen

import scala.js.gen.js.GenBase
import mtfrp.exp.DelayedEvalExp
import mtfrp.lang.Client
import java.io.PrintWriter
import hokko.core.Engine

trait GenDelayedEval extends GenBase {
  val IR: DelayedEvalExp
  import IR._

  var client: Client = _
  var engine: Engine = _

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case DelayedForClient(thunk) =>
      emitValDef(sym, quote(thunk(client, engine)))
    case _ => super.emitNode(sym, rhs)
  }

  def emitSourceForClient[A: Manifest](client: Client, engine: Engine, args: List[Sym[_]], body: Block[A], name: String, out: PrintWriter) = {
    this.client = client
    this.engine = engine
    this.emitSource(args, body, name, out)
  }
}
