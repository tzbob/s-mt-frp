package mtfrp.gen

import akka.actor._
import java.io.{PrintWriter, StringWriter}
import java.net.URLEncoder
import java.util.UUID
import mtfrp.exp.MtFrpProgExp
import mtfrp.lang.{Client, MtFrpProgRunner}
import scala.xml.Unparsed
import spray.http.MediaTypes
import spray.httpx.marshalling.ToResponseMarshallable.isMarshallable
import spray.routing.{Route, Directives}
import spray.routing.Directives._

object PageCompiler {
  import Directives._

  def makeRoute[Main](csses: Seq[String] = Seq.empty, scripts: Seq[String] = Seq.empty)(
    prog: MtFrpProgRunner with MtFrpProgExp
  )(
    gen: GenMtFrp { val IR: prog.type }
  )(
    url: String
  )(implicit f: ActorRefFactory): Route = {
    lazy val (rep, route, engine) = prog.run
    val block = gen.reifyBlock(rep)

    val scriptsD = "smtfrp-js-bundle.js" +: scripts

    def html(client: Client, csses: Seq[String], scripts: Seq[String]) = {
      val sw = new StringWriter
      val out = new PrintWriter(sw)
      gen.emitSourceForClient(client, engine, Nil, block, "", out)
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
        respondWithMediaType(MediaTypes.`text/html`) {
          complete {
            val id = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
            html(Client(id), csses, scriptsD)
          }
        }
      }
    }

    route match {
      case Some(route) => pageRoute ~ route
      case None => pageRoute
    }
  }

}
