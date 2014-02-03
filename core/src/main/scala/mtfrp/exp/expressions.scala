package mtfrp.exp

import scala.js.exp.{AdtsExp, FFIExp, JSExp, JSLibExp, JSLiteralExp}
import scala.js.exp.dom.{BrowserExp, ElementOpsExp, EventOpsExp}

import forest.ForestExp
import mtfrp.gen.GenMtFrp
import mtfrp.lang.{ClientEventLib, ClientSignalLib, DocumentOpsExtended, FrpLib, JSJsonFormatLib, JSJsonReaderLib, JSJsonWriterLib, MtFrpProg, ServerEventLib}

trait JSJsonReaderLibExp extends JSJsonReaderLib with JSExp with FFIExp {
  protected[mtfrp] def parse[T: Manifest](raw: Rep[String]): Rep[T] =
    foreign"JSON.parse($raw)"[T]
}
trait JSJsonWriterLibExp extends JSJsonWriterLib with JSExp with FFIExp {
  protected[mtfrp] def stringify[T](raw: Rep[T]): Rep[String] =
    foreign"JSON.stringify($raw)"[String]
}

trait JSJsonFormatLibExp
  extends JSJsonFormatLib
  with JSJsonReaderLibExp
  with JSJsonWriterLibExp

trait DocumentOpsExtendedExp extends DocumentOpsExtended with BrowserExp with FFIExp {
  protected[mtfrp] def documentCreateElement[A: Manifest](d: Rep[Document], e: ElementTagName[A]): Rep[e.Type] =
    foreign"$d.createElement(${unit(e.name)})"[e.Type]
}

trait ClientEventLibExp
    extends ClientEventLib
    with ClientSignalLibExp
    with JSJsonReaderLibExp
    with BaconLibExp
    with EventSourcesExp
    with JSExp
    with JSLiteralExp
    with EventOpsExp {
  self: ServerEventLibExp =>
}

trait ClientSignalLibExp
    extends ClientSignalLib
    with BaconLibExp
    with JSExp {
  self: ClientEventLibExp =>
}

trait ServerEventLibExp
    extends ServerEventLib
    with JSJsonWriterLibExp
    with JSExp
    with XMLHttpRequestsExp {
  self: ClientEventLibExp =>
}

trait FrpLibExp
  extends FrpLib
  with ClientEventLibExp
  with ServerEventLibExp
  with ClientSignalLibExp

trait FrpExtensions
  extends FrpLibExp
  with ElementOpsExp
  with EventOpsExp

trait MtFrpProgExp
  extends MtFrpProg
  with FrpExtensions
  with ForestExp
  with BrowserExp
  with AdtsExp
  with DocumentOpsExtendedExp