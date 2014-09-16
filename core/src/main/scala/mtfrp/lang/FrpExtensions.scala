package mtfrp.lang

import scala.js.language.dom.ElementOps
import scala.js.language.dom.EventOps
import com.sun.org.apache.xml.internal.serializer.ToStream

trait FrpExtensions extends FrpLib with ElementOps with EventOps {

  implicit class ReactiveTargetOps(et: Rep[EventTarget]) {
    def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEvent[ev.Type] = {
      val bus = FRP.eventSource[ev.Type](globalContext)
      def pusher(event: Rep[ev.Type]) = bus.fire(event)
      eventtarget_on(et, new EventName[ev.Type](ev.name), unit(false), pusher)
      ClientEvent(bus)
    }
  }

  case object KeyPress extends EventName[Event]("keypress")
  case object KeyUp extends EventName[Event]("keyup")
  implicit class ReactiveInputOps(e: Rep[Input]) extends Serializable {
    def values: ClientBehavior[String] = {
      val evt = e.toStream(KeyUp).map(_ => ())
        .or(e.toStream(Click).map(_ => ()))
        .or(e.toStream(Change).map(_ => ()))
      evt.map(_ => e.value).hold("")
    }
  }

}