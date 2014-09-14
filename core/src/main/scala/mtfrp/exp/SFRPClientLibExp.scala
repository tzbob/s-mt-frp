package mtfrp.exp

import scala.js.exp.{ FFIExp, ProxyExp }
import mtfrp.lang.SFRPClientLib

trait SFRPCientLibExp extends SFRPClientLib with ProxyExp with FFIExp {
  case object FRPVar extends Exp[FRP]
  val FRP = FRPVar
  val globalContext = FRP.global
}