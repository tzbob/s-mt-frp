package mtfrp.exp

import scala.js.exp.FFIExp
import scala.js.exp.{AdtsExp, JSLiteralExp, ProxyExp}
import scala.js.exp.dom.EventOpsExp
import mtfrp.lang.EventSources

import scala.js.gen.js.GenAdts

trait EventSourcesExp extends EventSources with EventOpsExp with AdtsExp with FFIExp {
  case class NewEventSource(url: Exp[String]) extends Def[EventSource]
  protected def newEvtSource(url: Exp[String]) = reflectEffect(NewEventSource(url))

  case class NewListener(src: Rep[EventSource], evt: Rep[String], f: Rep[Dataliteral => Unit]) extends Def[Unit]
  protected def newListener(src: Rep[EventSource], evt: Rep[String], f: Rep[Dataliteral => Unit]): Rep[Unit] =
    reflectEffect(NewListener(src, evt, f))

  implicit def addEventSourceOps(evt: Rep[EventSource]): EventSourceOps =
    new EventSourceOpsImpl(evt)

  class EventSourceOpsImpl(evt: Rep[EventSource]) extends EventSourceOps {
    def listen(eventName: Rep[String])(f: Rep[Dataliteral => Unit]): Rep[Unit] =
      newListener(evt, eventName, f)

    def onOpen(handler: Rep[Open => Unit]): Rep[Unit] =
      foreign"$evt.onopen = $handler".withEffect()

    def onError(handler: Rep[Error => Unit]): Rep[Unit] =
      foreign"$evt.onerror = $handler".withEffect()
  }
}
