package mtfrp

import scala.js.gen.js.GenAjax
import scala.js.gen.js.GenCPS
import scala.js.gen.js.GenCastChecked
import scala.js.gen.js.GenDebug
import scala.js.gen.js.GenFFI
import scala.js.gen.js.GenFunctions
import scala.js.gen.js.GenJS
import scala.js.gen.js.GenJSLib
import scala.js.gen.js.dom.GenBrowser
import scala.js.gen.js.dom.GenElementOps
import scala.js.gen.js.dom.GenSelectorOps
import scala.xml.Unparsed
import akka.actor.ActorSystem
import mtfrp.client.GenBaconLib
import mtfrp.client.MtFrpClient
import mtfrp.client.PageCompiler
import mtfrp.server.MtFrpServer
import reactive.EventStream
import reactive.Timer
import spray.routing.SimpleRoutingApp
import scala.js.gen.js.GenStruct
import forest.Forest
import forest.ForestExp
import forest.JSGenForest

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
    def main: ClientSignal[Element] =
      serverCounter.toClient.hold("click the button!") map template

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