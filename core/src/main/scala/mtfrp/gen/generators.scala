package mtfrp.gen

import scala.js.gen.js.{ GenAdts, GenFFI, GenJS, GenJSMaps }
import scala.js.gen.js.dom.GenBrowser
import forest.JSGenForest
import mtfrp.exp.{ ClientFRPLibExp, JSJsonFormatLibExp, JSJsonReaderLibExp, JSJsonWriterLibExp, MtFrpLibExp, MtFrpProgExp, ReplicationCoreLibExp, ReplicationFRPLibExp, ServerFRPLibExp }
import scala.js.gen.js.dom.GenElementOps
import scala.js.gen.js.dom.GenEventOps
import scala.js.gen.js.GenProxy
import mtfrp.lang.FrpExtensions
import mtfrp.exp.FrpExtensionsExp

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

trait GenClientFRPLib
    extends GenSFRPClientLib
    with GenReplicationCoreLib
    with GenJS {
  val IR: ClientFRPLibExp
}

trait GenServerFRPLib extends GenReplicationCoreLib {
  val IR: ServerFRPLibExp
}

trait GenReplicationFRPLib
    extends GenServerFRPLib
    with GenJSJsonFormat
    with GenEventSources {
  val IR: ReplicationFRPLibExp
}

trait GenFrpExtensions
    extends GenClientFRPLib
    with GenElementOps
    with GenEventOps
    with GenProxy {
  val IR: FrpExtensionsExp
}

trait GenMtFrpLib
    extends GenClientFRPLib
    with GenServerFRPLib
    with GenReplicationFRPLib {
  val IR: MtFrpLibExp
}

trait GenMtFrp
    extends GenBrowser
    with JSGenForest
    with GenMtFrpLib
    with GenAdts
    with GenFrpExtensions
    with GenVNodeBuilderLib {
  val IR: MtFrpProgExp
}