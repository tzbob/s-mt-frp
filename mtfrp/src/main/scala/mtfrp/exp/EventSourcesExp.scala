package mtfrp.exp

import scala.js.exp.{AdtsExp, JSLiteralExp, ProxyExp}
import scala.js.exp.dom.EventOpsExp
import mtfrp.lang.EventSources

import scala.js.gen.js.GenAdts

trait EventSourcesExp extends EventSources with EventOpsExp with JSLiteralExp with ProxyExp with AdtsExp {
  case class NewEventSource(url: Exp[String]) extends Def[EventSource]
  protected def newEvtSource(url: Exp[String]) = reflectEffect(NewEventSource(url))
  case class NewListener(src: Rep[EventSource], evt: Rep[String], f: Rep[Dataliteral => Unit]) extends Def[EventSource]
  protected def newListener(src: Rep[EventSource], evt: Rep[String], f: Rep[Dataliteral => Unit]): Rep[EventSource] =
    reflectEffect(NewListener(src, evt, f))
}
