package mtfrp.lang

import scala.js.language.dom.ElementOps
import scala.js.language.dom.EventOps

trait FrpExtensions extends FrpLib with ElementOps with EventOps {

  implicit class ReactiveTargetOps(e: Rep[EventTarget]) {
    def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEvent[ev.Type] = {
      val bus = Bus[ev.Type]()
      e.on(ev) { bus push _ }
      ClientEvent(bus)
    }
  }

  case object KeyUp extends EventName[Event]("keyup")
  implicit class ReactiveInputOps(e: Rep[Input]) {
    def values: ClientEvent[String] = e.toStream(KeyUp).map(_ => e.value)
  }

}