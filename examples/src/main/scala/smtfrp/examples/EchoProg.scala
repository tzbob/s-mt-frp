package smtfrp.examples

import spray.json.DefaultJsonProtocol
import scala.js.language.AdtsImpl.Adt
import mtfrp.lang.MtFrpProg

trait EchoProg extends MtFrpProg with EasyHTML {
  import DefaultJsonProtocol._

  case class EchoData(name: String, text: String) extends Adt
  val ClientEchoData = adt[EchoData]
  implicit val echoFormat = jsonFormat2(EchoData)

  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)

  lazy val clientInput: ClientEvent[EchoData] = {
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior
    val entry = nameV.combine(msgV) { ClientEchoData(_, _) }
    entry.sampledBy(sendE)
  }

  def template(data: Rep[EchoData]): Rep[VNode] = {
    implicit def echoDataOps(p: Rep[EchoData]) = adtOps(p)

    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT("Submit")

    div(
      h1("Echo prog"),
      div(data.name, " says ", data.text),
      div(name, msg, send))
  }

  def main: ClientBehavior[VNode] =
    clientInput.toServerAnon
      .toAllClients
      .hold(ClientEchoData("<>", "<>"))
      .map(template)
}