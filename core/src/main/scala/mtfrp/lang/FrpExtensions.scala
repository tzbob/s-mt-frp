package mtfrp.lang

import scala.js.language.dom.ElementOps
import scala.js.language.dom.EventOps

trait FrpExtensions extends ClientFRPLib with ElementOps with EventOps {

  implicit class ReactiveTargetOps(et: Rep[EventTarget]) {
    def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEvent[ev.Type] = {
      val bus = FRP.eventSource[ev.Type](FRP.global)
      def pusher(event: Rep[ev.Type]) = bus.fire(event)
      eventtarget_on(et, new EventName[ev.Type](ev.name), unit(false), pusher)
      ClientEvent(bus, ReplicationCore())
    }
  }

  trait KeyboardEvent extends Event {
    def keyCode: Rep[Int]
  }
  implicit class KbdEvt(rep: Rep[KeyboardEvent]) {
    def keyCode: Rep[Int] = keyCodeImpl(rep)
  }

  def keyCodeImpl(r: Rep[KeyboardEvent]): Rep[Int]

  case object KeyPress extends EventName[KeyboardEvent]("keypress")
  case object KeyUp extends EventName[KeyboardEvent]("keyup")

  trait InputEvent extends Event {
    def target: Rep[EventTarget]
  }

  implicit class InputEvt(rep: Rep[InputEvent]) {
    def target: Rep[EventTarget] = targetImpl(rep)
    def value: Rep[String] = target.asInstanceOf[Rep[Input]].value
  }
  def targetImpl(r: Rep[InputEvent]): Rep[EventTarget]

  case object Input extends EventName[InputEvent]("input")

  implicit class ReactiveInputOps(e: Rep[Input]) extends Serializable {
    def values: ClientBehavior[String] = {
      val evt = e.toStream(KeyUp).map(_ => ())
        .or(e.toStream(Click).map(_ => ()))
        .or(e.toStream(Change).map(_ => ()))
      evt.map(_ => e.value).hold("")
    }
  }

}