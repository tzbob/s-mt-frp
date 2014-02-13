package mtfrp.lang

import scala.js.language.dom.ElementOps
import scala.js.language.dom.EventOps
import com.sun.org.apache.xml.internal.serializer.ToStream

trait FrpExtensions extends FrpLib with ElementOps with EventOps {

  implicit class ReactiveTargetOps(e: Rep[EventTarget]) {
    def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEvent[ev.Type] = {
      val bus = Bus[ev.Type]()
      e.on(ev) { bus push _ }
      ClientEvent(bus)
    }
  }

  case object KeyPress extends EventName[Event]("keypress")
  case object KeyUp extends EventName[Event]("keyup")
  implicit class ReactiveInputOps(e: Rep[Input]) extends Serializable {
    def values: ClientEvent[String] = {
      val evt = e.toStream(KeyUp).map(_ => ())
        .merge(e.toStream(Click).map(_ => ()))
        .merge(e.toStream(Change).map(_ => ()))
      evt.map(_ => e.value)
    }
  }

}