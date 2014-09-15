package mtfrp.exp

import scala.js.exp.{ AdtsExp, FFIExp, JSExp, JSLibExp, JSLiteralExp }
import scala.js.exp.dom.{ BrowserExp, ElementOpsExp, EventOpsExp }
import forest.ForestExp
import mtfrp.gen.GenMtFrp
import mtfrp.lang.{ ClientEventLib, ClientBehaviorLib, DocumentOpsExtended, FrpLib, JSJsonFormatLib, JSJsonReaderLib, JSJsonWriterLib, MtFrpProg, ServerEventLib }
import mtfrp.lang.ServerBehaviorLib

trait JSJsonReaderLibExp extends JSJsonReaderLib with JSExp with FFIExp with AdtsExp {
  def parse[T: Manifest](raw: Exp[String]): Exp[T] =
    foreign"JSON.parse($raw)"[T].withEffect()
}

trait JSJsonWriterLibExp extends JSJsonWriterLib with JSExp with FFIExp with AdtsExp {
  def stringify[T](raw: Exp[T]): Exp[String] =
    foreign"JSON.stringify($raw)"[String].withEffect()
}

trait JSJsonFormatLibExp
  extends JSJsonFormatLib
  with JSJsonReaderLibExp
  with JSJsonWriterLibExp

trait DocumentOpsExtendedExp extends DocumentOpsExtended with BrowserExp with FFIExp {
  case class CreateElement[A](d: Exp[Document], name: String) extends Def[A]

  protected[mtfrp] def documentCreateElement[A: Manifest](d: Exp[Document], e: ElementTagName[A]): Exp[e.Type] =
    foreign"$d.createElement(${unit(e.name)})"[e.Type].withEffect()
  protected[mtfrp] def elementSetInnerHTML(e: Exp[Element], s: Exp[String]): Exp[Unit] =
    foreign"$e.innerHTML = $s"[Unit].withEffect()
  protected[mtfrp] def elementInnerHTML(e: Exp[Element]): Exp[String] =
    foreign"$e.innerHTML"[String].withEffect()
}

trait ClientEventLibExp
  extends ClientEventLib
  with JSJsonReaderLibExp
  with SFRPClientLibExp
  with EventSourcesExp
  with JSExp
  with JSLiteralExp
  with EventOpsExp
  with DelayedEvalExp {
  self: ServerEventLibExp with ClientBehaviorLibExp =>
}

trait ClientBehaviorLibExp
  extends ClientBehaviorLib
  with SFRPClientLibExp
  with JSExp
  with DelayedEvalExp {
  self: ServerBehaviorLibExp =>
}

trait ServerEventLibExp
  extends ServerEventLib
  with JSJsonWriterLibExp
  with JSExp
  with XMLHttpRequestsExp
  with DelayedEvalExp {
  self: ClientEventLibExp with ServerBehaviorLibExp =>
}

trait ServerBehaviorLibExp
  extends ServerBehaviorLib
  with JSExp {
  self: ClientBehaviorLibExp =>
}

trait FrpLibExp
  extends FrpLib
  with ClientEventLibExp
  with ServerEventLibExp
  with ClientBehaviorLibExp
  with ServerBehaviorLibExp

trait FrpExtensionsExp
  extends FrpLibExp
  with ElementOpsExp
  with EventOpsExp

trait MtFrpProgExp
  extends MtFrpProg
  with JSJsonFormatLibExp
  with FrpExtensionsExp
  with ForestExp
  with BrowserExp
  with AdtsExp
  with DocumentOpsExtendedExp