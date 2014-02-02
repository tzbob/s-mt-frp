package mtfrp.gen

import scala.js.gen.js.{GenJSLiteral, GenProxy}
import mtfrp.exp.XMLHttpRequestsExp

trait GenXMLHttpRequests extends GenJSLiteral with GenProxy {
  val IR: XMLHttpRequestsExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case NewXMLHttpRequest() =>
      emitValDef(sym, s"new XMLHttpRequest()")
    case _ => super.emitNode(sym, rhs)
  }
}