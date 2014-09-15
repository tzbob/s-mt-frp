package smtfrp.examples

import akka.actor.ActorSystem
import mtfrp.exp.MtFrpProgExp
import mtfrp.gen.PageCompiler
import spray.routing.SimpleRoutingApp

object Demo extends App with SimpleRoutingApp {
  val bootstrap = Seq("bootstrap/css/bootstrap.css", "css/flat-ui.css")

  val routeMaker = PageCompiler.makeRoute(csses = bootstrap)_
  val echoProg = new EchoProg with MtFrpProgExp
  val echoRoute = routeMaker(echoProg)("echo")

  val guestProg = new GuestbookProg with MtFrpProgExp
  val guestRoute = routeMaker(guestProg)("guest")

  val basicChatProg = new BasicChatProg with MtFrpProgExp
  val basicChatRoute = routeMaker(basicChatProg)("basicchat")

  val chatProg = new ChatProg with MtFrpProgExp
  val chatRoute = routeMaker(chatProg)("chat")

  val multiDepsProg = new MultipleDeps with MtFrpProgExp
  val multiDepsRoute = routeMaker(multiDepsProg)("deps")

  val glitchesProg = new TestGlitches with MtFrpProgExp
  val glitchesRoute = routeMaker(glitchesProg)("glitches")

  implicit val system = ActorSystem("simple-apps")
  startServer("localhost", port = 8080)(
    getFromResourceDirectory("")
      ~ echoRoute
      ~ guestRoute
      ~ basicChatRoute
      ~ chatRoute
      ~ multiDepsRoute
      ~ glitchesRoute)
}
