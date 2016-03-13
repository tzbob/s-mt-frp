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
    def input: Rep[Input] = target.asInstanceOf[Rep[Input]]
    def value: Rep[String] = input.value
    def checked: Rep[Boolean] = input.checked
  }
  protected[html] def targetImpl(r: Rep[InputEvent]): Rep[EventTarget]

  case object Input extends EventName[InputEvent]("input")

  implicit class ValueEvent(e: ClientEvent[InputEvent]) {
    def asTextBehavior: ClientDiscreteBehavior[String] =
      e.asTextEvent.hold("")
    def asTextIncBehavior: ClientIncBehavior[String, String] =
      e.asTextEvent.fold("") { (_, x) => x }
    def asTextEvent: ClientEvent[String] =
      e.map(_.value)
    def asCheckedBehavior(startWith: Rep[Boolean]): ClientDiscreteBehavior[Boolean] =
      e.map(_.checked).hold(startWith)
  }
}
