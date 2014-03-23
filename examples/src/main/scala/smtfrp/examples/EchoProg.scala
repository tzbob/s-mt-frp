package smtfrp.examples

import spray.json.DefaultJsonProtocol
import scala.js.language.AdtsImpl.Adt
import mtfrp.lang.MtFrpProg

trait EchoProg extends MtFrpProg with EasyHTML {
  import DefaultJsonProtocol._

  case class EchoData(name: String, text: String) extends Adt
  val ClientEchoData = adt[EchoData]
  implicit val echoFormat = jsonFormat2(EchoData)

  def main: ClientBehavior[Element] =
    singleClientInput.toAllClients.hold(ClientEchoData("<>", "<>")) map template

  def template(data: Rep[EchoData]): Rep[Element] = {
    implicit def echoDataOps(p: Rep[EchoData]) = adtOps(p)
    el('div)(
      el('h1)("Echo prog"),
      el('div)(data.name, " says ", data.text),
      el('div)(name, text, send)
    )
  }

  lazy val singleClientInput = input.toServerAnon

  lazy val input: ClientEvent[EchoData] = {
    val combined = name.values.combine(text.values)(ClientEchoData(_, _))
    combined sampledBy send.toStream(Click)
  }

  lazy val name: Rep[Input] = text("Name")
  lazy val text: Rep[Input] = text("Text")
  lazy val send: Rep[Button] = button("Send")
}