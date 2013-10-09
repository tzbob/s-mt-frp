package mtfrp.client

import scala.js.gen.js.GenProxy
import scala.js.gen.js.GenFFI

trait GenBaconLib extends GenProxy with GenFFI {
  val IR: BaconLibExp
  import IR._

  override def quote(x: Exp[Any]): String = x match {
    case BaconVar => "Bacon"
    case _        => super.quote(x)
  }
}