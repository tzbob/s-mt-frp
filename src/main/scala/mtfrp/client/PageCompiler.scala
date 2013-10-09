package mtfrp.client

import java.io.PrintWriter
import java.io.StringWriter
import scala.xml.Unparsed
import mtfrp.GenMtFrpServer
import spray.http.MediaTypes
import spray.routing.Directive.pimpApply
import spray.routing.Directives
import spray.routing.Route
import spray.routing.directives.CompletionMagnet.fromObject
import mtfrp.server.MtFrpServer

object PageCompiler extends Directives {

  def makeRoute(prog: MtFrpServer)(clientStream: => prog.ClientEventStream,
    url: String): Route = {

    lazy val stream = {
      import prog._
      val stream = clientStream
      val span = document.find("#span")
      stream.exp onValue fun { (str: Rep[String]) =>
        for { s <- span } s setInnerHTML str
      }
      stream
    }

    val gen = new GenMtFrpServer {
      val IR: prog.type = prog
    }

    val sw = new StringWriter
    gen.emitExecution(stream.exp, new PrintWriter(sw))
    val js = sw.toString

    val html =
      <html>
        <head>
          <title>Demo</title>
          <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
          <script src="http://cdnjs.cloudflare.com/ajax/libs/bacon.js/0.6.8/Bacon.min.js"></script>
        </head>
        <body>
          <span id="span">default text</span>
          <script type="text/javascript">{ Unparsed(js) }</script>
        </body>
      </html>

    println(html)

    path(url) {
      get {
        respondWithMediaType(MediaTypes.`text/html`)(complete(html))
      }
    } ~ stream.initRoute
  }

}