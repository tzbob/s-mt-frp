package mtfrp.exp

import scala.js.exp.{ JSExp, JSLibExp, JSLiteralExp }
import scala.js.exp.dom.{ BrowserExp, EventOpsExp }
import mtfrp.lang.{ ClientEventLib, ClientSignalLib, MtFrpProg, ServerEventLib }
import mtfrp.gen.GenMtFrp
import mtfrp.gen.GenMtFrp
import scala.js.exp.FFIExp

trait JSJsonReaderContextExp extends JSExp with FFIExp {
  protected[mtfrp] def parse[T: Manifest](raw: Rep[String]): Rep[T] =
    foreign"JSON.parse($raw)"[T]
}
trait JSJsonWriterContextExp extends JSExp with FFIExp {
  protected[mtfrp] def stringify[T](raw: Rep[T]): Rep[String] =
    foreign"JSON.stringify($raw)"[String]
}

trait ClientEventLibExp
    extends ClientEventLib
    with JSJsonReaderContextExp
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
    with JSJsonWriterContextExp
    with JSExp
    with XMLHttpRequestsExp {
  self: ClientEventLibExp =>
}

trait MtFrpProgExp
  extends MtFrpProg
  with ClientEventLibExp
  with ServerEventLibExp
  with ClientSignalLibExp
  with BrowserExp