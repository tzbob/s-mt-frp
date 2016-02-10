package mtfrp.examples

import akka.actor.ActorSystem
import java.util.concurrent.Executors
import mtfrp.gen.PageCompiler
import mtfrp.html.gen.GenHtmlRunnerLib
import mtfrp.html.lang.HtmlRunnerLib
import scala.concurrent.ExecutionContext
import spray.routing.SimpleRoutingApp

object Examples extends App with SimpleRoutingApp {
  val ec = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(1))
  implicit val system = ActorSystem("simple-apps", None, None, Some(ec))

  val tacit = Seq("css/tacit.min.css")

  def makeRoute(htmlProg: HtmlRunnerLib, url: String) = {
    PageCompiler.makeRoute(csses = tacit)(htmlProg)(GenHtmlRunnerLib(htmlProg))(url)
  }

  val helloWorld = new HtmlRunnerLib {
    def main = ClientDiscreteBehavior.constant {
      div()()(
        h1()()("Hello World"),
        p()() {
          """Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum."""
        }
      )
    }
  }

  startServer("0.0.0.0", port = 8080)(
    getFromResourceDirectory("")
      ~ makeRoute(helloWorld, "helloWorld")
  )
}
