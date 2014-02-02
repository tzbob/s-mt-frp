package mtfrp.gen

import mtfrp.exp.JSJsonReaderContextExp
import scala.js.gen.js.dom.GenBrowser
import scala.js.gen.js.GenJSLib
import mtfrp.exp.MtFrpProgExp
import mtfrp.exp.ClientEventLibExp
import scala.js.gen.js.dom.GenEventOps
import scala.js.gen.js.GenJS
import scala.js.gen.js.GenJSLiteral
import mtfrp.exp.JSJsonWriterContextExp
import mtfrp.exp.ServerEventLibExp
import mtfrp.exp.ClientSignalLibExp
import scala.js.gen.js.GenFFI

trait GenJSJsonReaderContext extends GenJS with GenFFI {
  val IR: JSJsonReaderContextExp
}

trait GenJSJsonWriterContext extends GenJS with GenFFI {
  val IR: JSJsonWriterContextExp
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

trait GenMtFrp
    extends GenClientEventLib
    with GenServerEventLib
    with GenClientSignalLib
    with GenBrowser {
  val IR: MtFrpProgExp
}