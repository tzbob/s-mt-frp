package mtfrp.client

import scala.js.exp.JSExp

import mtfrp.client.frp.BaconLibExp
import spray.routing.Route

trait ClientSignalLib { self: BaconLibExp with JSExp with ClientEventStreamLib =>
  class ClientSignal[T: Manifest] private[mtfrp] (
      val initRoute: Option[Route],
      val exp: Exp[Property[T]]) {

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientSignal[A] =
      new ClientSignal(initRoute, exp.map(fun(modifier)))
  }
}