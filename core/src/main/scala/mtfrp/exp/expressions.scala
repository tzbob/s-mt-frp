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
    foreign"JSON.parse($raw)"[T].withEffect()
}

trait JSJsonWriterLibExp extends JSJsonWriterLib with FFIExp with AdtsExp {
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

trait ReplicationCoreLibExp
  extends JSJsonFormatLibExp
  with DelegatorExp

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

trait FrpExtensionsExp
  extends FrpExtensions
  with ClientFRPLibExp
  with ElementOpsExp
  with EventOpsExp
  with FFIExp {
  def keyCodeImpl(r: Rep[KeyboardEvent]) = foreign"$r.keyCode"[Int].withEffect()
  def targetImpl(r: Rep[InputEvent]) = foreign"$r.target"[EventTarget].withEffect()
}

trait HtmlNodeLibExp extends HtmlNodeBuilderLibExp

trait MtFrpProgExp
  extends MtFrpProg
  with MtFrpLibExp
  with JSJsonFormatLibExp
  with FrpExtensionsExp
  with BrowserExp
  with AdtsExp
  with DocumentOpsExtendedExp
  with HtmlNodeLibExp
  with NonRecJSExp {
  lazy val ontick: Rep[Unit => Unit] = foreign"MTFRP.ontick".withEffect()
}
