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

trait GenMtFrpClient extends GenBaconLib with GenFunctions with GenBrowser with GenJS {
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
    def main: ClientEventStream[String] =
      serverModification.toClient map { x: Rep[String] =>
        "client map: " + x
      }

    def serverModification =
      inputOnServer map ("server map: " + _ / 1000)

    def inputOnServer =
      clientInput.toServer

    def clientInput =
      new Timer(0, 1000) map (_.toInt) toClient
  }

  def generatHTML(js: String) =
    <html>
      <head>
        <title>Demo</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script src="http://cdnjs.cloudflare.com/ajax/libs/bacon.js/0.6.8/Bacon.min.js"></script>
      </head>
      <body>
        <button id="btn">Hit me!</button>
        <script type="text/javascript">{ Unparsed(js) }</script>
      </body>
    </html>

  val prog = new RoundTrip {}

  val programRoute = PageCompiler.makeRoute(prog)("")

  implicit val system = ActorSystem("simple-routing-app")
  startServer("localhost", port = 8080)(programRoute)
}