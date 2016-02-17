package mtfrp.lang

import scala.language.implicitConversions

import scala.js.language.{Adts, JSLiteral, Proxy}
import scala.js.language.dom.EventOps

trait EventSources extends EventOps with Adts {
  object EventSource {
    def apply(url: Rep[String]) = newEvtSource(url)
  }
  protected def newEvtSource(url: Rep[String]): Rep[EventSource]

  case class Dataliteral(data: String) extends Adt
  implicit def dataOps(p: Rep[Dataliteral]) = adtOps(p)

  trait Open
  trait Error

  trait EventSource extends EventTarget

  implicit def addEventSourceOps(evt: Rep[EventSource]): EventSourceOps

  trait EventSourceOps {
    def listen(eventName: Rep[String])(f: Rep[Dataliteral => Unit]): Rep[Unit]
    def onOpen(handler: Rep[Open => Unit]): Rep[Unit]
    def onError(handler: Rep[Error => Unit]): Rep[Unit]
  }
}
