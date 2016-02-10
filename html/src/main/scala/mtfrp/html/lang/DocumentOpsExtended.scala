package mtfrp.html.lang

import mtfrp.lang.ClientFRPLib
import scala.js.language.dom.Browser

trait DocumentOpsExtended
  extends Browser
  with ClientFRPLib {

  implicit class DocumentOpsExtended(document: Rep[Document]) {
    def createElement[A: Manifest](e: ElementTagName[A]): Rep[e.Type] =
      documentCreateElement(document, e)
  }

  implicit class ElementInnerHTML(e: Rep[Element]) {
    def setInnerHTML(html: Rep[String]): Rep[Unit] = elementSetInnerHTML(e, html)
    def innerHTML: Rep[String] = elementInnerHTML(e)
  }

  protected[html] def documentCreateElement[A: Manifest](d: Rep[Document], e: ElementTagName[A]): Rep[e.Type]
  protected[html] def elementSetInnerHTML(e: Rep[Element], s: Rep[String]): Rep[Unit]
  protected[html] def elementInnerHTML(e: Rep[Element]): Rep[String]

  class ElementTagName[A](val name: String) {
    type Type = A
  }

  case object InputTag extends ElementTagName[Input]("input")
  case object FormTag extends ElementTagName[Form]("form")
  case object ButtonTag extends ElementTagName[Button]("button")

  trait Button extends Element

  // implicit class ReactiveTargetOps(et: Rep[EventTarget]) {
  //   def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEvent[ev.Type] = {
  //     val bus = FRP.eventSource[ev.Type](FRP.global)
  //     def pusher(event: Rep[ev.Type]) = bus.fire(event)
  //     eventtarget_on(et, new EventName[ev.Type](ev.name), unit(false), pusher)
  //     ClientEvent(bus, ReplicationCore())
  //   }
  // }

  trait KeyboardEvent extends Event {
    def keyCode: Rep[Int]
  }

  implicit class KbdEvt(rep: Rep[KeyboardEvent]) {
    def keyCode: Rep[Int] = keyCodeImpl(rep)
  }

  protected[html] def keyCodeImpl(r: Rep[KeyboardEvent]): Rep[Int]

  case object KeyPress extends EventName[KeyboardEvent]("keypress")
  case object KeyUp extends EventName[KeyboardEvent]("keyup")

  trait InputEvent extends Event {
    def target: Rep[EventTarget]
  }

  implicit class InputEvt(rep: Rep[InputEvent]) {
    def target: Rep[EventTarget] = targetImpl(rep)
    def value: Rep[String] = target.asInstanceOf[Rep[Input]].value
  }
  protected[html] def targetImpl(r: Rep[InputEvent]): Rep[EventTarget]

  case object Input extends EventName[InputEvent]("input")

  // implicit class ReactiveInputOps(e: Rep[Input]) extends Serializable {
  //   def values: ClientBehavior[String] = {
  //     val evt = e.toStream(KeyUp).map(_ => ())
  //       .or(e.toStream(Click).map(_ => ()))
  //       .or(e.toStream(Change).map(_ => ()))
  //     evt.map(_ => e.value).hold("")
  //   }
  // }

  implicit class ValueEvent(e: ClientEvent[InputEvent]) extends Serializable {
    def asTextBehavior: ClientBehavior[String] = asTextBehaviorImpl(e)
  }
  private def asTextBehaviorImpl(e: ClientEvent[InputEvent]): ClientBehavior[String] =
    e.map(fun(_.value)).hold("")
}
