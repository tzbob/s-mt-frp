package mtfrp.exp

import scala.js.exp.{ FFIExp, ProxyExp }
import mtfrp.lang.SFRPClientLib

trait SFRPClientLibExp extends SFRPClientLib with ProxyExp {
  case object FRPVar extends Def[FRP]
  val FRP: Exp[FRP] = FRPVar
}