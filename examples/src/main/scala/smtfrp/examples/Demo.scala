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

object Demo extends App with SimpleRoutingApp {
  val bootstrap = Seq("bootstrap/css/bootstrap.css", "css/flat-ui.css")

  val routeMaker = PageCompiler.makeRoute(csses = bootstrap)_
  val echoProg = new EchoProg with MtFrpProgExp with NoDB
  val echoRoute = routeMaker(echoProg)("echo")

  val guestProg = new GuestbookProg with MtFrpProgExp with NoDB
  val guestRoute = routeMaker(guestProg)("guest")

  val basicChatProg = new BasicChatProg with MtFrpProgExp with NoDB
  val basicChatRoute = routeMaker(basicChatProg)("basicchat")

  val chatProg = new ChatProg with MtFrpProgExp with NoDB
  val chatRoute = routeMaker(chatProg)("chat")

  val multiDepsProg = new MultipleDeps with MtFrpProgExp with NoDB
  val multiDepsRoute = routeMaker(multiDepsProg)("deps")

  val glitchesProg = new TestGlitches with MtFrpProgExp with NoDB
  val glitchesRoute = routeMaker(glitchesProg)("glitches")

  val todoProg = new TodoCore with MtFrpProgExp {
    type Profile = H2Driver
    val driver = H2Driver
    val database = driver.simple.Database.forURL("jdbc:h2:mem:test1;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")

    override def main: ClientBehavior[Element] = {
      val oldMain = super.main
      oldMain.core.mergedManipulatorDependencies.foreach { deps =>
        val manipulators = deps.map(_.manipulator)
        val triggers = deps.map(_.trigger)
        database.withSession { s: driver.simple.Session =>
          s.withTransaction {
            manipulators.foreach(_(s))
          }
          triggers.foreach(_(s))
        }
      }
      oldMain
    }
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
