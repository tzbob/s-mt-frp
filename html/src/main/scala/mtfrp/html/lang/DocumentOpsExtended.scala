package mtfrp.html.lang

import scala.js.language.dom.Browser

trait DocumentOpsExtended extends Browser {
  implicit class DocumentOpsExtended(document: Rep[Document]) {
    def createElement[A: Manifest](e: ElementTagName[A]): Rep[e.Type] =
      documentCreateElement(document, e)
  }

  implicit class ElementInnerHTML(e: Rep[Element]) {
    def setInnerHTML(html: Rep[String]): Rep[Unit] = elementSetInnerHTML(e, html)
    def innerHTML: Rep[String] = elementInnerHTML(e)
  }

  protected[mtfrp] def documentCreateElement[A: Manifest](d: Rep[Document], e: ElementTagName[A]): Rep[e.Type]
  protected[mtfrp] def elementSetInnerHTML(e: Rep[Element], s: Rep[String]): Rep[Unit]
  protected[mtfrp] def elementInnerHTML(e: Rep[Element]): Rep[String]

  class ElementTagName[A](val name: String) {
    type Type = A
  }

  case object InputTag extends ElementTagName[Input]("input")
  case object FormTag extends ElementTagName[Form]("form")
  case object ButtonTag extends ElementTagName[Button]("button")

  trait Button extends Element
}
