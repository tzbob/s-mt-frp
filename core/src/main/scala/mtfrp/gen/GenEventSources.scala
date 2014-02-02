package mtfrp.gen

import scala.js.gen.js.dom.GenEventOps
import scala.js.gen.js.GenJSLiteral
import scala.js.gen.js.GenProxy
import mtfrp.exp.EventSourcesExp

trait GenEventSources extends GenEventOps with GenJSLiteral with GenProxy {
  val IR: EventSourcesExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case NewEventSource(url) =>
      emitValDef(sym, s"new EventSource(${quote(url)})")
    case _ => super.emitNode(sym, rhs)
  }
}