package mtfrp.exp
import scala.js.exp.JSLiteralExp
import scala.js.exp.ProxyExp
import scala.js.exp.dom.EventOpsExp
import mtfrp.lang.EventSources

trait EventSourcesExp extends EventSources with EventOpsExp with JSLiteralExp with ProxyExp {
  case class NewEventSource(url: Exp[String]) extends Def[EventSource]
  protected def newEvtSource(url: Exp[String]) = NewEventSource(url)
}