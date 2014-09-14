package mtfrp.gen

import scala.js.gen.js.{ GenFFI, GenProxy }
import mtfrp.exp.BaconLibExp
import mtfrp.exp.SFRPCientLibExp

trait GenSFRPClientLib extends GenProxy with GenFFI {
  val IR: SFRPCientLibExp
  import IR._

  override def quote(x: Exp[Any]): String = x match {
    case FRPVar => "FRP()"
    case _      => super.quote(x)
  }
}