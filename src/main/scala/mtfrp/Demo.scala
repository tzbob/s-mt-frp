package mtfrp

import scala.js.gen.js.{GenFunctions, GenJS}
import scala.js.gen.js.dom.GenBrowser

import akka.actor.ActorSystem
import forest.JSGenForest
import mtfrp.client.{MtFrpClient, PageCompiler}
import mtfrp.client.frp.GenBaconLib
import mtfrp.server.MtFrpServer
import spray.json.DefaultJsonProtocol.{IntJsonFormat, StringJsonFormat}
import spray.routing.SimpleRoutingApp

trait GenMtFrpClient extends GenBaconLib with GenFunctions with GenBrowser with GenJS with JSGenForest {
  val IR: MtFrpClient
}

trait GenMtFrpServer extends GenMtFrpClient {
  val IR: MtFrpServer
}

object Demo extends App with SimpleRoutingApp {

  trait RoundTrip extends MtFrpClient with MtFrpServer {
    import spray.json.DefaultJsonProtocol._

    /**
     * create a client-sided signal from a server-sided signal
     * client signal contains:
     * 	client-sided bridge Exps
     *  server-sided bridge Routes
     *  an actual Exp representing the signal
     *
     */
    def main: ClientSignal[Element] = counterText map template

    def counterText: ClientSignal[String] =
      serverCounter.toClient.hold("click the button!")

    def template(counterText: Rep[String]): Rep[Element] = el('div)(
      el('h1)("Demo page"),
      el('h2)("How?"),
      el('p, 'style -> "width:400px;")(s"""
              The current implementation will naively replace the contents of body
              everytime the main ClientSignal updates.
	          """),
      el('p)("Enjoy the counter: " + counterText),
      plus,
      min
    )

    def serverCounter: ServerEventStream[String] = {
      val minMap = min.toStream(Click) map (_ => -1)
      inputOnServer.fold(0)(_ + _) map ("server map: " + _)
    }

    def inputOnServer: ServerEventStream[Int] = clientInput.toServer

    def clientInput: ClientEventStream[Int] = {
      val plusMap = plus.toStream(Click) map (_ => 1)
      val minMap = min.toStream(Click) map (_ => -1)
      plusMap.merge(minMap)
    }

    lazy val plus: Rep[Element] = el('button)("+1")
    lazy val min: Rep[Element] = el('button)("-1")
  }

  val prog = new RoundTrip {}

  val programRoute = PageCompiler.makeRoute(prog)("")

  implicit val system = ActorSystem("simple-routing-app")
  startServer("localhost", port = 8080)(programRoute)
}