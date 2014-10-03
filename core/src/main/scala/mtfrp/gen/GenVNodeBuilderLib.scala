package mtfrp.gen

import scala.js.gen.js.GenJSMaps
import scala.js.gen.js.dom.GenEventOps
import scala.js.gen.js.GenJS
import mtfrp.exp.EventSourcesExp
import mtfrp.exp.VNodeBuilderLibExp
import scala.js.gen.js.dom.GenElementOps
import scala.js.gen.QuoteGen

trait GenVNodeBuilderLib extends GenClientFRPLib with GenEventOps with GenJSMaps with GenJS with GenElementOps with QuoteGen {
  val IR: VNodeBuilderLibExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case MkText(str) =>
      emitValDef(sym, s"new MTFRP.VText(${quote(str)})")
    case MkNode(tag, props, children) =>
      emitValDef(sym, q"new MTFRP.VNode($tag, $props, $children)")
    case CreateElem(vnode) =>
      emitValDef(sym, q"MTFRP.createElement($vnode)")
    case Diff(prev, current) =>
      emitValDef(sym, q"MTFRP.diff($prev, $current)")
    case Patch(root, patch) =>
      emitValDef(sym, q"MTFRP.patch($root, $patch)")
    case _ => super.emitNode(sym, rhs)
  }
}