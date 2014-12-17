package mtfrp.gen

import mtfrp.exp.XMLHttpRequestsExp
import scala.js.gen.js._

trait GenXMLHttpRequests extends GenBase with GenEffect {
  val IR: XMLHttpRequestsExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case NewXMLHttpRequest() => emitValDef(sym, s"new XMLHttpRequest()")
    case _                   => super.emitNode(sym, rhs)
  }
}
