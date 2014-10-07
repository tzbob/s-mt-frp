package smtfrp.examples

import akka.actor.ActorSystem
import mtfrp.exp.MtFrpProgExp
import mtfrp.gen.PageCompiler
import spray.routing.SimpleRoutingApp
import scala.js.language.AdtsImpl.Adt
import frp.core.Behavior
import scala.slick.driver.JdbcProfile
import mtfrp.lang.NoDB
import scala.slick.driver.H2Driver
import mtfrp.lang.MtFrpProgRunner

object Demo extends App with SimpleRoutingApp {
  val bootstrap = Seq("bootstrap/css/bootstrap.css", "css/flat-ui.css")

  val routeMaker = PageCompiler.makeRoute(csses = bootstrap)_
  val echoProg = new EchoProg with MtFrpProgRunner with NoDB
  val echoRoute = routeMaker(echoProg)("echo")

  val guestProg = new GuestbookProg with MtFrpProgRunner with NoDB
  val guestRoute = routeMaker(guestProg)("guest")

  val basicChatProg = new BasicChatProg with MtFrpProgRunner with NoDB
  val basicChatRoute = routeMaker(basicChatProg)("basicchat")

  val chatProg = new ChatProg with MtFrpProgRunner with NoDB
  val chatRoute = routeMaker(chatProg)("chat")

  val multiDepsProg = new MultipleDeps with MtFrpProgRunner with NoDB
  val multiDepsRoute = routeMaker(multiDepsProg)("deps")

  val glitchesProg = new TestGlitches with MtFrpProgRunner with NoDB
  val glitchesRoute = routeMaker(glitchesProg)("glitches")

  val todoProg = new TodoCore with MtFrpProgRunner {
    type Profile = H2Driver
    val driver = H2Driver
    val database = driver.simple.Database.forURL("jdbc:h2:mem:test1;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
  }
  val todoRoute = routeMaker(todoProg)("todo")

  implicit val system = ActorSystem("simple-apps")
  startServer("localhost", port = 8080)(
    getFromResourceDirectory("")
      ~ echoRoute
      ~ guestRoute
      ~ basicChatRoute
      ~ chatRoute
      ~ multiDepsRoute
      ~ glitchesRoute
      ~ todoRoute)
}
