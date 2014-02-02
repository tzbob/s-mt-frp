package mtfrp.exp

import scala.js.exp.{ FFIExp, ProxyExp }
import mtfrp.lang.BaconLib

trait BaconLibExp extends BaconLib with ProxyExp with FFIExp {
  case object BaconVar extends Exp[Bacon]
  val bacon = BaconVar

  def newBus[T: Manifest]() = foreign"new Bacon.Bus()"[Bus[T]]
}