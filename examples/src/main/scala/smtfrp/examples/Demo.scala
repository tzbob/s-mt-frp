package smtfrp.examples

import akka.actor.ActorSystem
import mtfrp.exp.MtFrpProgExp
import mtfrp.gen.PageCompiler
import spray.routing.SimpleRoutingApp

object Demo extends App with SimpleRoutingApp {
  implicit val system = ActorSystem("simple-apps")

  val echoProg = new EchoProg with MtFrpProgExp
  val echoRoute = PageCompiler.makeRoute(echoProg)("echo")

  startServer("localhost", port = 8080)(echoRoute ~ getFromResourceDirectory(""))
}