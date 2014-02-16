package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol
import scala.util.Random
import mtfrp.lang.Client
import mtfrp.lang.ClientQuery

trait EchoProg extends MtFrpProg {
  import DefaultJsonProtocol._

  case class EchoData(name: String, text: String) extends Adt
  val ClientEchoData = adt[EchoData]
  implicit def echoDataOps(p: Rep[EchoData]) = adtOps(p)
  implicit val echoFormat = jsonFormat2(EchoData)

  def main: ClientSignal[Element] =
    broadcastInput.toClient.hold(ClientEchoData("<>", "<>")) map template

  def template(data: Rep[EchoData]): Rep[Element] = el('div)(
    el('h1)("Echo prog"),
    el('div)(data.name, " says ", data.text),
    el('div)(name, text, send)
  )

  lazy val broadcastInput = input.toServer.map { tup => (ClientQuery.any, tup._2) }
  lazy val input: ClientEvent[EchoData] = {
    val combined = name.values.combine(text.values)(ClientEchoData(_, _))
    val signal = combined hold ClientEchoData("", "")
    signal sampledBy send.toStream(Click)
  }

  lazy val name: Rep[Input] = createInput("text")
  lazy val text: Rep[Input] = createInput("text")
  lazy val send: Rep[Button] = {
    val send = document createElement ButtonTag
    send.setInnerHTML("Send")
    send
  }

  def createInput(tp: Rep[String]): Rep[Input] = {
    val el = document createElement InputTag
    el.setAttribute("type", tp)
    el
  }
}