package mtfrp.lang

import scala.language.implicitConversions

import scala.js.language.{ JSLiteral, Proxy }
import scala.js.language.dom.EventOps

trait EventSources extends EventOps with JSLiteral with Proxy {
  object EventSource {
    def apply(url: Rep[String]) = newEvtSource(url)
  }
  protected def newEvtSource(url: Rep[String]): Rep[EventSource]

  type Dataliteral = JSLiteral { val data: String }
  trait EventSource extends EventTarget {
    var onerror: Rep[JSLiteral => Unit]
    var onmessage: Rep[Dataliteral => Unit]
    var onopen: Rep[JSLiteral => Unit]
    def close(): Rep[Unit]
  }
  implicit def repToSource(x: Rep[EventSource]): EventSource =
    repProxy[EventSource](x)

}
