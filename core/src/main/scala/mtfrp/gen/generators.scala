package mtfrp.gen

import scala.js.gen.js.{GenAdts, GenFFI, GenJS, GenJSLiteral}
import scala.js.gen.js.dom.{GenBrowser, GenEventOps}

import forest.JSGenForest
import mtfrp.exp.{ClientEventLibExp, ClientSignalLibExp, FrpLibExp, JSJsonFormatLibExp, JSJsonReaderLibExp, JSJsonWriterLibExp, MtFrpProgExp, ServerEventLibExp}

trait GenJSJsonReaderContext extends GenJS with GenFFI {
  val IR: JSJsonReaderLibExp
}

trait GenJSJsonWriterContext extends GenJS with GenFFI {
  val IR: JSJsonWriterLibExp
}

trait GenJSJsonFormat extends GenJSJsonReaderContext with GenJSJsonWriterContext {
  val IR: JSJsonFormatLibExp
}

trait GenClientEventLib
    extends GenJSJsonReaderContext
    with GenBaconLib
    with GenEventSources
    with GenJS
    with GenJSLiteral
    with GenEventOps {
  self: GenServerEventLib =>
  val IR: ClientEventLibExp
}

trait GenClientSignalLib
    extends GenBaconLib
    with GenJS {
  self: GenClientEventLib =>
  val IR: ClientSignalLibExp
}

trait GenServerEventLib
    extends GenJSJsonWriterContext
    with GenJS
    with GenXMLHttpRequests {
  self: GenClientEventLib =>
  val IR: ServerEventLibExp
}

trait GenFrpLib
    extends GenClientEventLib
    with GenServerEventLib
    with GenClientSignalLib {
  val IR: FrpLibExp
}

trait GenMtFrp
    extends GenBrowser
    with JSGenForest
    with GenFrpLib
    with GenAdts {
  val IR: MtFrpProgExp
}