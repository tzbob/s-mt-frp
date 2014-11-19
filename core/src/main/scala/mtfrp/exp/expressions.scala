package mtfrp.exp

import scala.js.exp.{ AdtsExp, FFIExp, JSExp, JSMapsExp }
import scala.js.exp.dom.{ BrowserExp, ElementOpsExp, EventOpsExp }
import mtfrp.lang.{ DocumentOpsExtended, JSJsonFormatLib, JSJsonReaderLib, JSJsonWriterLib, MtFrpLib, MtFrpProg }
import mtfrp.lang.ClientFRPLib
import mtfrp.lang.ServerFRPLib
import mtfrp.lang.ReplicationFRPLib
import mtfrp.lang.FrpExtensions
import scala.js.exp.ProxyExp

trait JSJsonReaderLibExp extends JSJsonReaderLib with JSExp with FFIExp with AdtsExp {
  def parse[T: Manifest](raw: Exp[String]): Exp[T] =
    foreign"JSON.parse($raw)"[T].withEffect()
}

trait JSJsonWriterLibExp extends JSJsonWriterLib with JSExp with FFIExp with AdtsExp {
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
  with EventSourcesExp
  with SFRPClientLibExp
  with XMLHttpRequestsExp
  with DelayedEvalExp
  with JSMapsExp

trait ClientFRPLibExp
  extends ClientFRPLib
  with SFRPClientLibExp
  with ReplicationCoreLibExp
  with JSExp

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
  with HtmlNodeLibExp {
  lazy val ontick: Rep[Unit => Unit] = foreign"MTFRP.ontick".withEffect()
}