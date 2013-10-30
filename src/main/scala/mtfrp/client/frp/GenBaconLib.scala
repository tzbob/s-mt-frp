package mtfrp.client.frp

import scala.js.gen.js.{GenFFI, GenProxy}

trait GenBaconLib extends GenProxy with GenFFI {
  val IR: BaconLibExp
  import IR._

  override def quote(x: Exp[Any]): String = x match {
    case BaconVar => "Bacon"
    case _        => super.quote(x)
  }
}