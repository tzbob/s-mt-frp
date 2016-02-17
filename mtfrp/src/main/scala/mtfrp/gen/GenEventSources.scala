package mtfrp.gen

import scala.js.gen.js.GenFFI
import scala.js.gen.js.dom.GenEventOps
import scala.js.gen.js.{GenAdts, GenJSLiteral, GenProxy}
import mtfrp.exp.EventSourcesExp

trait GenEventSources extends GenEventOps with GenAdts with GenFFI {
  val IR: EventSourcesExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case NewEventSource(url) =>
      emitValDef(sym, s"new EventSource(${quote(url)})")
    case NewListener(src, evt, f) =>
      emitValDef(sym, s"${quote(src)}.addEventListener(${quote(evt)}, ${quote(f)})")
    case _ => super.emitNode(sym, rhs)
  }
}
