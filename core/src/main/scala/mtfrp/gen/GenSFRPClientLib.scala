package mtfrp.gen

import scala.js.gen.js.{ GenFFI, GenProxy }
import mtfrp.exp.SFRPClientLibExp

trait GenSFRPClientLib extends GenProxy {
  val IR: SFRPClientLibExp
  import IR._

  override def emitNode(sym: Sym[Any], rhs: Def[Any]) = rhs match {
    case FRPVar => emitValDef(sym, "MTFRP.FRP")
    case _      => super.emitNode(sym, rhs)
  }
}