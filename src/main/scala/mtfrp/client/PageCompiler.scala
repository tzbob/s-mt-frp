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
import forest.JSGenForest
import forest.ForestExp

object PageCompiler extends Directives {

  def makeRoute(prog: MtFrpServer)(url: String): Route = {
    lazy val signal = {
      import prog._
      val signal = prog.main

      signal.exp onValue fun { (str: Rep[Element]) =>
        document.body.setInnerHTML("")
        document.body.appendChild(str)
      }

      signal
    }

    val gen = new GenMtFrpServer {
      val IR: prog.type = prog
    }

    val sw = new StringWriter
    gen.emitExecution(signal.exp, new PrintWriter(sw))
    val js = sw.toString

    val html =
      <html>
        <head>
          <title>Demo</title>
          <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
          <script src="http://cdnjs.cloudflare.com/ajax/libs/bacon.js/0.6.8/Bacon.min.js"></script>
        </head>
        <body>
          <script type="text/javascript">{ Unparsed(js) }</script>
        </body>
      </html>

    println(html)

    val rootRoute = path(url) {
      get {
        respondWithMediaType(MediaTypes.`text/html`)(complete(html))
      }
    }

    signal.initRoute match {
      case Some(route) => rootRoute ~ route
      case None        => rootRoute
    }
  }

}