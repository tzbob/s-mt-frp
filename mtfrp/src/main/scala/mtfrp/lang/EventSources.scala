package mtfrp.lang

import scala.language.implicitConversions

import scala.js.language.{Adts, JSLiteral, Proxy}
import scala.js.language.dom.EventOps

trait EventSources extends EventOps with JSLiteral with Proxy with Adts {
  object EventSource {
    def apply(url: Rep[String]) = newEvtSource(url)
    def listen(src: Rep[EventSource])(evt: Rep[String])(f: Rep[Dataliteral => Unit]) = newListener(src, evt, f)
  }
  protected def newEvtSource(url: Rep[String]): Rep[EventSource]
  protected def newListener(src: Rep[EventSource], evt: Rep[String], f: Rep[Dataliteral => Unit]): Rep[EventSource]

  case class Dataliteral(data: String) extends Adt
  implicit def dataOps(p: Rep[Dataliteral]) = adtOps(p)

  trait EventSource extends EventTarget {
    var onerror: Rep[JSLiteral => Unit]
    var onmessage: Rep[Dataliteral => Unit]
    var onopen: Rep[JSLiteral => Unit]
    def close(): Rep[Unit]
  }

  implicit def repToSource(x: Rep[EventSource]): EventSource =
    repProxy[EventSource](x)
}
