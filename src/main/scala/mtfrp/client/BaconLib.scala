package mtfrp.client

import scala.js.language.Proxy

trait BaconLib extends Proxy {
  val bacon: Rep[Bacon]

  trait Bacon {
    def fromCallback[T](handler: Rep[(T => Unit) => Unit]): Rep[BaconStream[T]]
  }

  implicit def repToBacon(x: Rep[Bacon]): Bacon = repProxy[Bacon](x)

  implicit class BaconExtension(bacon: Rep[Bacon]) {
    def Bus[T: Manifest](): Rep[Bus[T]] = newBus[T]()
  }

  def newBus[T: Manifest](): Rep[Bus[T]]

  trait BaconStream[T] {
    def onValue(handler: Rep[T => Unit]): Rep[Unit]
    def map[A](modifier: Rep[T => A]): Rep[BaconStream[A]]
    def log(): Rep[Unit]
  }
  implicit def repToBaconStream[T: Manifest](x: Rep[BaconStream[T]]): BaconStream[T] = repProxy[BaconStream[T]](x)

  trait Bus[T] extends BaconStream[T] {
    def push(value: Rep[T]): Rep[Unit]
  }
  implicit def repToBus[T: Manifest](x: Rep[Bus[T]]): Bus[T] = repProxy[Bus[T]](x)

}