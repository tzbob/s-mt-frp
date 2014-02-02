package mtfrp.lang

import scala.js.language.JS
import spray.routing.Route

trait ClientSignalLib {
  self: BaconLib with JS with ClientEventLib =>

  class ClientSignal[T: Manifest] private[mtfrp] (
      val initRoute: Option[Route],
      val rep: Rep[Property[T]]) {

    def map[A: Manifest](modifier: Rep[T] => Rep[A]): ClientSignal[A] =
      new ClientSignal(initRoute, rep.map(fun(modifier)))
  }
}