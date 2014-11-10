package smtfrp.examples

import akka.actor.ActorSystem
import spray.routing.SimpleRoutingApp
import scala.slick.driver._
import mtfrp.lang._
import mtfrp.gen.PageCompiler
import scala.concurrent.ExecutionContext
import mtfrp.lang.MtFrpProgDbRunner
import mtfrp.lang.NoDB
import mtfrp.lang.MtFrpProgRunner
import java.util.concurrent.Executors
import scala.collection.mutable.ListBuffer

object Demo extends App with SimpleRoutingApp {
  val bootstrap = Seq("bootstrap/css/bootstrap.css", "css/flat-ui.css")

  val routeMaker = PageCompiler.makeRoute(csses = bootstrap)_
  lazy val echoProg = new EchoProg with MtFrpProgRunner with NoDB
  lazy val echoRoute = routeMaker(echoProg)("echo")

  lazy val basicChatProg = new BasicChatProg with MtFrpProgRunner with NoDB
  lazy val basicChatRoute = routeMaker(basicChatProg)("basicchat")

  lazy val chatProg = new BasicPersistentChat with MtFrpProgRunner with MtFrpProgDbRunner {
    type Profile = H2Driver
    val driver = H2Driver
    val database = driver.simple.Database.forURL("jdbc:h2:mem:test1;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
  }
  lazy val chatRoute = routeMaker(chatProg)("chat")

  lazy val glitchesProg = new TestGlitches with MtFrpProgRunner with NoDB
  lazy val glitchesRoute = routeMaker(glitchesProg)("glitches")

  lazy val todoProg = new TodoCore with MtFrpProgDbRunner {
    type Profile = H2Driver
    val driver = H2Driver
    val database = driver.simple.Database.forURL("jdbc:h2:mem:test1;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
  }
  lazy val todoRoute = routeMaker(todoProg)("todo")

  lazy val benchmarkProg = new CounterBenchmark with MtFrpProgRunner with NoDB
  lazy val benchRoute =
    PageCompiler.makeRoute(scripts = Seq("bench.js"))(benchmarkProg)("bench")

  val ec = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(1))
  implicit val system = ActorSystem("simple-apps", None, None, Some(ec))
  //  implicit val system = ActorSystem()

  var deltas = ListBuffer.empty[Long]
  var count = 0

  val timerRoute = path("logtime") {
    get {
      complete {
        count += 1
        deltas += System.currentTimeMillis() - benchmarkProg.x
        if (count >= benchmarkProg.clients) {
          deltas.foreach(println)
          println(deltas.sum / benchmarkProg.clients)
        }
        "OK "
      }
    }
  }

  startServer("0.0.0.0", port = 8080)(
    getFromResourceDirectory("")
      ~ echoRoute
      ~ basicChatRoute
      ~ chatRoute
      //~ glitchesRoute
      ~ benchRoute
      ~ timerRoute)
  //~ todoRoute)
}
