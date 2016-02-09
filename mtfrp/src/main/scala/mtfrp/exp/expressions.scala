package mtfrp.exp

import scala.js.exp._
import scala.js.exp.dom._
import mtfrp.lang._
import scala.virtualization.lms.common._
import scalajs2jsscala.DelegatorExp

trait NonRecJSExp extends DynamicsExp with ArraysExp
  with RegExpsExp with OptionOpsExp
  with EffectExp with NumericOpsExp with OrderingOpsExp with EqualExp
  with IfThenElseExp with WhileExp with BooleanOpsExp with StringOpsExp with VariablesExp with ListOpsExp
  with ObjectOpsExp with TupledFunctionsExp /*with TupledFunctionsRecursiveExp*/ with StructExp with PrimitiveOpsExp with MiscOpsExp
  with TupleOpsExp with ListOps2Exp

trait JSJsonReaderLibExp extends JSJsonReaderLib with FFIExp with AdtsExp {
  def parse[T: Manifest](raw: Exp[String]): Exp[T] =
    foreign"JSON.parse($raw)"[T]
}

trait JSJsonWriterLibExp extends JSJsonWriterLib with FFIExp with AdtsExp {
  def stringify[T](raw: Exp[T]): Exp[String] =
    foreign"JSON.stringify($raw)"[String]
}

trait JSJsonFormatLibExp
  extends JSJsonFormatLib
  with JSJsonReaderLibExp
  with JSJsonWriterLibExp

trait ReplicationCoreLibExp
  extends JSJsonFormatLibExp
  with EventSourcesExp
  with DelegatorExp
  with DelayedEvalExp
  with XMLHttpRequestsExp
  with ListOpsExp
  with ListOps2Exp
  with TupleOpsExp
  with OptionOpsExp
  with JSMapsExp

trait ClientFRPLibExp
  extends ClientFRPLib
  with DelegatorExp
  with ReplicationCoreLibExp
// with JSExp - remove support for recursive functions
// manually put JSExp together

trait ServerFRPLibExp extends ServerFRPLib with ReplicationCoreLibExp

trait ReplicationFRPLibExp
  extends ReplicationFRPLib
  with ClientFRPLibExp
  with ServerFRPLibExp
  with JSJsonFormatLibExp
  with EventSourcesExp

trait MtFrpLibExp
  extends MtFrpLib
  with ClientFRPLibExp
  with ServerFRPLibExp
  with ReplicationFRPLibExp

trait MtFrpProgExp[Main]
  extends MtFrpProg[Main]
  with MtFrpLibExp
  with JSJsonFormatLibExp
  with AdtsExp
  with NonRecJSExp {
  lazy val ontick: Rep[Unit => Unit] = foreign"MTFRP.ontick".withEffect()
}
