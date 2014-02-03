package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol

trait EchoProg extends MtFrpProg {
  import DefaultJsonProtocol._

  case class EchoData(name: String, text: String) extends Adt
  val ClientEchoData = adt[EchoData]
  implicit def pointOps(p: Rep[EchoData]) = adtOps(p)

  implicit val echoFormat = jsonFormat2(EchoData)
  implicit object EchoDataJSJSonWriter extends JSJsonWriter[EchoData] {
    def write(raw: Rep[EchoData]): Rep[String] = stringify(raw)
  }
  implicit object EchoDataJSJsonReader extends JSJsonReader[EchoData] {
    def read(raw: Rep[String]) = parse[EchoData](raw)
  }

  lazy val main: ClientSignal[Element] =
    inputOnServer.toClient.hold(ClientEchoData("<>", "<>")) map template

  def template(data: Rep[EchoData]): Rep[Element] = el('div)(
    el('h1)("Echo prog"),
    el('div)(data.name, data.text),
    el('div)(name, text, send)
  )

  lazy val inputOnServer: ServerEvent[EchoData] = input.toServer
  lazy val input: ClientEvent[EchoData] =
    name.values.combine(text.values) { (name, text) =>
      ClientEchoData(name, text)
    }

  lazy val name: Rep[Input] = createInput("text")
  lazy val text: Rep[Input] = createInput("text")
  lazy val send: Rep[Button] = document createElement ButtonTag

  def createInput(tp: Rep[String]): Rep[Input] = {
    val el = document createElement InputTag
    el.setAttribute("type", tp)
    el
  }
}