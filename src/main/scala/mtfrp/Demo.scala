package mtfrp

import scala.js.gen.js.{ GenFunctions, GenJS }
import scala.js.gen.js.dom.GenBrowser
import akka.actor.ActorSystem
import forest.JSGenForest
import mtfrp.client.{ MtFrpClient, PageCompiler }
import mtfrp.client.frp.GenBaconLib
import mtfrp.server.MtFrpServer
import spray.json.DefaultJsonProtocol.{ IntJsonFormat, StringJsonFormat }
import spray.routing.SimpleRoutingApp
import java.util.Calendar

trait GenMtFrpClient extends GenBaconLib with GenFunctions with GenBrowser with GenJS with JSGenForest {
  val IR: MtFrpClient
}

trait GenMtFrpServer extends GenMtFrpClient {
  val IR: MtFrpServer
  import IR._
}

object Demo extends App with SimpleRoutingApp {

  trait RoundTrip extends MtFrpClient with MtFrpServer {
    import spray.json.DefaultJsonProtocol._

    def main: ClientSignal[Element] = clientChatContents map template

    def clientChatContents: ClientSignal[List[String]] =
      chatContents.hold(collection.immutable.List("Empty conversation")).toClient

    def template(data: Rep[List[String]]): Rep[Element] = el('div, 'class -> "text-center")(
      el('h1)("FRP Chat"),
      el('ol, 'id -> "chat", 'style -> "width: 400px; margin: 20px auto;")(
        for (line <- data) yield el('li, 'class -> "line")(line)
      ),
      el('div)(name, msg, send)
    )

    def chatContents: ServerEventStream[List[String]] =
      filteredInput.fold(collection.immutable.List.empty[String])(_ :+ _)

    def filteredInput: ServerEventStream[String] =
      clientInput.toServer.filter(!_.contains("callback"))

    def clientInput: ClientEventStream[String] = {
      val nameInput = name.as[Input]
      val msgInput = msg.as[Input]
      val clicks = send toStream Click
      clicks map (_ => nameInput.value + " says " + msgInput.value)
    }

    lazy val name: Rep[Element] = el('input, 'type -> "text", 'placeholder -> "Name here...")()
    lazy val msg: Rep[Element] = el('input, 'type -> "text", 'placeholder -> "Message here...")()
    lazy val send: Rep[Element] = el('button)("Send")
  }

  val prog = new RoundTrip {}

  val programRoute = PageCompiler.makeRoute(prog)("")

  implicit val system = ActorSystem("simple-routing-app")
  startServer("localhost", port = 8080)(programRoute ~ getFromResourceDirectory(""))
}