package mtfrp.html.exp

import mtfrp.exp.ClientFRPLibExp
import mtfrp.html.lang.DocumentOpsExtended
import scala.js.exp.FFIExp
import scala.js.exp.dom.BrowserExp

trait DocumentOpsExtendedExp
  extends DocumentOpsExtended
  with BrowserExp
  with FFIExp
  with ClientFRPLibExp {

  case class CreateElement[A](d: Exp[Document], name: String) extends Def[A]

  protected[html] def documentCreateElement[A: Manifest](d: Exp[Document], e: ElementTagName[A]): Exp[e.Type] =
    foreign"$d.createElement(${unit(e.name)})"[e.Type].withEffect()
  protected[html] def elementSetInnerHTML(e: Exp[Element], s: Exp[String]): Exp[Unit] =
    foreign"$e.innerHTML = $s"[Unit].withEffect()
  protected[html] def elementInnerHTML(e: Exp[Element]): Exp[String] =
    foreign"$e.innerHTML"[String].withEffect()

  protected[html] def keyCodeImpl(r: Rep[KeyboardEvent]) = foreign"$r.keyCode"[Int].withEffect()
  protected[html] def targetImpl(r: Rep[InputEvent]) = foreign"$r.target"[EventTarget].withEffect()
}
