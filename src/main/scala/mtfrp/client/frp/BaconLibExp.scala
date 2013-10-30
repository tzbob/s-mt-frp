package mtfrp.client.frp

import scala.js.exp.{FFIExp, ProxyExp}

trait BaconLibExp extends BaconLib with ProxyExp with FFIExp {
  case object BaconVar extends Exp[Bacon]
  val bacon = BaconVar

  def newBus[T: Manifest](): Rep[Bus[T]] = foreign"new Bacon.Bus()"[Bus[T]].withEffect()
}