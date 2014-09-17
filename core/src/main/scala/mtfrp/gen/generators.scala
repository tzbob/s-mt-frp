package mtfrp.gen

import scala.js.gen.js.{ GenAdts, GenFFI, GenJS, GenJSLiteral }
import scala.js.gen.js.dom.{ GenBrowser, GenEventOps }
import forest.JSGenForest
import mtfrp.exp.{ ClientEventLibExp, ClientBehaviorLibExp, FrpLibExp, JSJsonFormatLibExp, JSJsonReaderLibExp, JSJsonWriterLibExp, MtFrpProgExp, ServerEventLibExp }
import scala.js.gen.js.GenJSMaps
import mtfrp.exp.ReplicationCoreLibExp

trait GenJSJsonReaderContext extends GenJS with GenFFI with GenAdts {
  val IR: JSJsonReaderLibExp
}

trait GenJSJsonWriterContext extends GenJS with GenFFI with GenAdts {
  val IR: JSJsonWriterLibExp
}

trait GenJSJsonFormat extends GenJSJsonReaderContext with GenJSJsonWriterContext {
  val IR: JSJsonFormatLibExp
}

trait GenReplicationCoreLib
    extends GenJSJsonFormat
    with GenEventSources
    with GenSFRPClientLib
    with GenXMLHttpRequests
    with GenDelayedEval
    with GenJSMaps {
  val IR: ReplicationCoreLibExp
}

trait GenClientEventLib
    extends GenJSJsonReaderContext
    with GenSFRPClientLib
    with GenJS
    with GenJSLiteral
    with GenDelayedEval
    with GenReplicationCoreLib {
  self: GenServerEventLib =>
  val IR: ClientEventLibExp
}

trait GenClientBehaviorLib
    extends GenSFRPClientLib
    with GenJS
    with GenDelayedEval {
  self: GenClientEventLib =>
  val IR: ClientBehaviorLibExp
}

trait GenServerEventLib
    extends GenJSJsonWriterContext
    with GenJS
    with GenXMLHttpRequests
    with GenDelayedEval
    with GenReplicationCoreLib {
  self: GenClientEventLib =>
  val IR: ServerEventLibExp
}

trait GenFrpLib
    extends GenClientEventLib
    with GenServerEventLib
    with GenClientBehaviorLib {
  val IR: FrpLibExp
}

trait GenMtFrp
    extends GenBrowser
    with JSGenForest
    with GenFrpLib
    with GenAdts {
  val IR: MtFrpProgExp
}