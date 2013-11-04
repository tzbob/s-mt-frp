package mtfrp.client

import java.io.{ PrintWriter, StringWriter }

import scala.xml.Unparsed

import mtfrp.GenMtFrpServer
import mtfrp.server.MtFrpServer
import spray.http.MediaTypes
import spray.routing.{ Directives, Route }
import spray.routing.Directive.pimpApply
import spray.routing.directives.CompletionMagnet.fromObject

object PageCompiler extends Directives {

  def makeRoute(prog: MtFrpServer)(url: String): Route = {
    lazy val signal = {
      import prog._
      val signal = prog.main

      signal.exp onValue fun { (str: Rep[Element]) =>
        // clean body
        document.body.setInnerHTML("")
        // fill body
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
          <title>Chat</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <!-- Loading Bootstrap -->
          <link href="bootstrap/css/bootstrap.css" rel="stylesheet"/>
          <!-- Loading Flat UI -->
          <link href="css/flat-ui.css" rel="stylesheet"/>
          <link rel="shortcut icon" href="images/favicon.ico"/>
        </head>
        <body>
          <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
          <script src="http://cdnjs.cloudflare.com/ajax/libs/bacon.js/0.6.8/Bacon.min.js"></script>
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