package mtfrp.gen

import scala.js.gen.js.{ GenFFI, GenProxy }
import mtfrp.exp.SFRPClientLibExp

trait GenSFRPClientLib extends GenProxy {
  val IR: SFRPClientLibExp
  import IR._

  override def quote(x: Exp[Any]): String = x match {
    case FRPVar => "FRP()"
    case _      => super.quote(x)
  }
}