package mtfrp.gen

import mtfrp.exp._
import scala.js.gen.js._
import scala.js.gen.js.dom._
import scala.virtualization.lms.common.GenericGenUnboxedTupleAccess
import scalajs2jsscala.GenDelegator

trait GenNonRecJS extends GenEffect with GenNumericOps with GenOrderingOps with GenEqual
  with GenIfThenElse with GenWhile with GenBooleanOps with GenStringOps with GenVariables
  with GenListOps with GenObjectOps with GenFunctions with GenStruct with GenPrimitiveOps
  with GenMiscOps with GenTupleOps with GenericGenUnboxedTupleAccess with GenListOps2
  with GenDynamics with GenArrays with GenRegExps with GenOptionOps {
  val IR: NonRecJSExp
}

trait GenJSJsonReaderContext extends GenFFI with GenAdts {
  val IR: JSJsonReaderLibExp
}

trait GenJSJsonWriterContext extends GenFFI with GenAdts {
  val IR: JSJsonWriterLibExp
}

trait GenJSJsonFormat extends GenJSJsonReaderContext with GenJSJsonWriterContext {
  val IR: JSJsonFormatLibExp
}

trait GenReplicationCoreLib
  extends GenJSJsonFormat
  with GenDelegator
  with GenDelayedEval
  with GenJSMaps {
  val IR: ReplicationCoreLibExp
}

trait GenClientFRPLib
  extends GenDelegator
  with GenReplicationCoreLib {
  val IR: ClientFRPLibExp
}

trait GenServerFRPLib extends GenReplicationCoreLib {
  val IR: ServerFRPLibExp
}

trait GenReplicationFRPLib
  extends GenServerFRPLib
  with GenXMLHttpRequests
  with GenJSJsonFormat
  with GenEventSources {
  val IR: ReplicationFRPLibExp
}

trait GenMtFrpLib
  extends GenClientFRPLib
  with GenServerFRPLib
  with GenReplicationFRPLib {
  val IR: MtFrpLibExp
}

trait GenMtFrp[Main]
  extends GenMtFrpLib
  with GenAdts
  with GenNonRecJS {
  val IR: MtFrpProgExp[Main]
}
