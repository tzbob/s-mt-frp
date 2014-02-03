package mtfrp.lang

import scala.js.language.dom.Browser

trait DocumentOpsExtended extends Browser {
  implicit class DocumentOpsExtended(document: Rep[Document]) {
    def createElement[A](e: ElementTagName[A]): Rep[e.Type] =
      documentCreateElement(document, e)
  }

  protected[mtfrp] def documentCreateElement[A](d: Rep[Document], e: ElementTagName[A]): Rep[e.Type]

  class ElementTagName[A](val name: String) {
    type Type = A
  }

  case object InputTag extends ElementTagName[Input]("input")
  case object FormTag extends ElementTagName[Form]("form")
  case object ButtonTag extends ElementTagName[Button]("button")

  trait Button extends Element
}