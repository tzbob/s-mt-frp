package smtfrp.examples

import akka.actor.ActorSystem
import mtfrp.exp.MtFrpProgExp
import mtfrp.gen.PageCompiler
import spray.routing.SimpleRoutingApp

object Demo extends App with SimpleRoutingApp {
  val echoProg = new EchoProg with MtFrpProgExp
  val echoRoute = PageCompiler.makeRoute(echoProg)("echo")

  val guestProg = new GuestbookProg with MtFrpProgExp
  val guestRoute = PageCompiler.makeRoute(guestProg)("guest")

  implicit val system = ActorSystem("simple-apps")
  startServer("localhost", port = 8080)(
    getFromResourceDirectory("")
      ~ echoRoute
      ~ guestRoute
  )
}