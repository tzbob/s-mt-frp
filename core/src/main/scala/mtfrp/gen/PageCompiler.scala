package mtfrp.gen

import java.io.{ PrintWriter, StringWriter }
import java.net.URLEncoder
import java.util.UUID
import scala.xml.Unparsed
import mtfrp.exp.MtFrpProgExp
import spray.http.{ HttpCookie, MediaTypes }
import spray.httpx.marshalling.ToResponseMarshallable.isMarshallable
import spray.routing.Directive.pimpApply
import spray.routing.{ Route, Directives }
import mtfrp.lang.Client

object PageCompiler {
  import Directives._

  def makeRoute(csses: Seq[String] = Seq.empty, scripts: Seq[String] = Seq.empty)(prog: MtFrpProgExp)(url: String): Route = {
    lazy val (rep, route) = prog.mainGen
    val gen = new GenMtFrp { val IR: prog.type = prog }
    val block = gen.reifyBlock(rep)

    val scriptsD = "s-frp-js-fastopt.js" +: scripts

    def html(client: Client, csses: Seq[String], scripts: Seq[String]) = {
      val sw = new StringWriter
      val out = new PrintWriter(sw)
      gen.emitSourceForClient(client, Nil, block, "", out)
      val js = sw.toString

      <html>
        <head>
          <title>Chat</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          { csses.map { css => <link href={ css } rel="stylesheet"/> } }
          <link rel="shortcut icon" href="images/favicon.ico"/>
        </head>
        <body>
          { scripts.map { script => <script src={ script }></script> } }
          <script type="text/javascript">({ Unparsed(js) })()</script>
        </body>
      </html>
    }

    val pageRoute = path(url) {
      get {
        dynamic {
          val id = URLEncoder encode (UUID.randomUUID.toString, "UTF-8")
          respondWithMediaType(MediaTypes.`text/html`) {
            complete(html(Client(id), csses, scriptsD))
          }
        }
      }
    }

    route match {
      case Some(route) => pageRoute ~ route
      case None        => pageRoute
    }
  }

}