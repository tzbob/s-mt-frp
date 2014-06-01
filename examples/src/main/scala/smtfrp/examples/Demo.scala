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

  val basicChatProg = new BasicChatProg with MtFrpProgExp
  val basicChatRoute = PageCompiler.makeRoute(basicChatProg)("basicchat")

  val chatProg = new ChatProg with MtFrpProgExp
  val chatRoute = PageCompiler.makeRoute(chatProg)("chat")

  val multiDepsProg = new MultipleDeps with MtFrpProgExp
  val multiDepsRoute = PageCompiler.makeRoute(multiDepsProg)("deps")

  implicit val system = ActorSystem("simple-apps")
  startServer("localhost", port = 8080)(
    getFromResourceDirectory("")
      ~ echoRoute
      ~ guestRoute
      ~ basicChatRoute
      ~ chatRoute
      ~ multiDepsRoute
  )
}
