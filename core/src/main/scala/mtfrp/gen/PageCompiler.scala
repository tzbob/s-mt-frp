package mtfrp.gen

import spray.routing.Directives
import spray.routing.Route
import spray.http.MediaTypes
import mtfrp.lang.MtFrpProg
import java.io.StringWriter
import java.io.PrintWriter
import scala.xml.Unparsed
import mtfrp.exp.MtFrpProgExp

object PageCompiler {
  import Directives._

  def makeRoute(prog: MtFrpProgExp)(url: String): Route = {
    lazy val signal = {
      import prog._
      val signal = prog.main
      signal.rep onValue fun { (str: Rep[Element]) =>
        // clean body
        document.body.firstChild.foreach(_.remove())
        // fill body
        document.body.appendChild(str)
      }
      signal
    }

    val sw = new StringWriter
    val gen = new GenMtFrp { val IR: prog.type = prog }
    gen.emitExecution(signal.rep, new PrintWriter(sw))
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