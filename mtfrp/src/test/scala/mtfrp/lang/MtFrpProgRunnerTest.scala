package mtfrp.lang

import akka.actor.ActorSystem
import java.util.concurrent.Executors
import mtfrp.gen.PageCompiler
import mtfrp.lang._
import scala.concurrent.ExecutionContext
import spray.routing.SimpleRoutingApp
import org.scalatest.FunSuite

import mtfrp.gen.GenTestRunnerLib

object Test {

  val e2sb2c = new TestRunnerLib[Int] {
    override def inputList = List(3, 6, 9)

    lazy val b1 = input.toServer.fold(_ => 0) { _ + _ }
    lazy val b2 = b1.map(_ * 2)

    override lazy val main: ClientDiscreteBehavior[Assertion] =
      b1.toClient.discreteMap2(b2.toClient.map(_ / 2)) { _ === _ }
  }

  val b2sb2c = new TestRunnerLib[Int] {
    override def inputList = List(3, 6, 9)

    lazy val bStart = input.fold(0){ _ + _ }
    lazy val b2Start = input.hold(0).map(_ * 2)

    lazy val bServer = bStart.toServer(_ => 0)
    lazy val b2Server = b2Start.toServer(_ => 0)

    lazy val bEnd = bServer.toClient
    lazy val b2End = b2Server.toClient.map(_ / 2)

    override lazy val main: ClientDiscreteBehavior[Assertion] =
      bEnd.discreteMap2(b2End) { _ === _ }
  }

}

class MtFrpProgRunnerTest extends FunSuite with SimpleRoutingApp {
  test("This should run without errors") {
    def e2sb2cRoute = PageCompiler.makeRoute()(Test.e2sb2c)(GenTestRunnerLib(Test.e2sb2c))("e2sb2c")
    def b2sb2cRoute = PageCompiler.makeRoute()(Test.b2sb2c)(GenTestRunnerLib(Test.b2sb2c))("b2sb2c")

    val ec = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(1))
    implicit val system = ActorSystem("simple-apps", None, None, Some(ec))

    startServer("0.0.0.0", port = 8080)(
      getFromResourceDirectory("")
        ~ e2sb2cRoute
        ~ b2sb2cRoute
    )
  }
}
