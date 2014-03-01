package mtfrp.exp

import scala.js.exp.{ AdtsExp, FFIExp, JSExp, JSLibExp, JSLiteralExp }
import scala.js.exp.dom.{ BrowserExp, ElementOpsExp, EventOpsExp }
import forest.ForestExp
import mtfrp.gen.GenMtFrp
import mtfrp.lang.{ ClientEventLib, ClientBehaviorLib, DocumentOpsExtended, FrpLib, JSJsonFormatLib, JSJsonReaderLib, JSJsonWriterLib, MtFrpProg, ServerEventLib }
import mtfrp.lang.ServerBehaviorLib

trait JSJsonReaderLibExp extends JSJsonReaderLib with JSExp with FFIExp with AdtsExp {
  def parse[T: Manifest](raw: Exp[String]): Exp[T] =
    foreign"JSON.parse($raw)".withEffect[T]()
}

trait JSJsonWriterLibExp extends JSJsonWriterLib with JSExp with FFIExp with AdtsExp {
  def stringify[T](raw: Exp[T]): Exp[String] =
    foreign"JSON.stringify($raw)".withEffect[String]()
}

trait JSJsonFormatLibExp
  extends JSJsonFormatLib
  with JSJsonReaderLibExp
  with JSJsonWriterLibExp

trait DocumentOpsExtendedExp extends DocumentOpsExtended with BrowserExp with FFIExp {
  protected[mtfrp] def documentCreateElement[A: Manifest](d: Exp[Document], e: ElementTagName[A]): Exp[e.Type] =
    foreign"$d.createElement(${unit(e.name)})".withEffect[e.Type]()
  protected[mtfrp] def elementSetInnerHTML(e: Exp[Element], s: Exp[String]): Exp[Unit] =
    foreign"$e.innerHTML = $s".withEffect()
  protected[mtfrp] def elementInnerHTML(e: Exp[Element]): Exp[String] =
    foreign"$e.innerHTML".withEffect()
}

trait ClientEventLibExp
    extends ClientEventLib
    with JSJsonReaderLibExp
    with BaconLibExp
    with EventSourcesExp
    with JSExp
    with JSLiteralExp
    with EventOpsExp {
  self: ServerEventLibExp with ClientBehaviorLibExp =>
}

trait ClientBehaviorLibExp
    extends ClientBehaviorLib
    with BaconLibExp
    with JSExp
    with DelayedEvalExp {
  self: ServerBehaviorLibExp =>
}

trait ServerEventLibExp
    extends ServerEventLib
    with JSJsonWriterLibExp
    with JSExp
    with XMLHttpRequestsExp {
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