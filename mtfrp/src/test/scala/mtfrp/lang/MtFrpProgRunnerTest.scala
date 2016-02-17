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

  val prog = new TestRunnerLib[Int] {
    override def inputList = List(3, 6, 9)

    lazy val inputBehavior = input.fold(2) { (acc: Rep[Int], n: Rep[Int]) =>
      acc + n
    }

    lazy val clientDoubles = inputBehavior.map { (i: Rep[Int]) => i * 2 }
    lazy val clientAlwaysTrue = inputBehavior.discreteMap2(clientDoubles)(fun { (i: Rep[Int], i2: Rep[Int]) =>
      i < i2
    })

    lazy val sessionInput = input.toServer
    lazy val sessionBehavior = sessionInput.fold(_ => 2)(_ + _)
    lazy val sessionDoubles = sessionBehavior.map { i =>
      i * 2
    }
    lazy val sessionAlwaysTrue = sessionBehavior.discreteMap2(sessionDoubles)(_ < _)

    lazy val clientAssert = clientAlwaysTrue.map { (bool: Rep[Boolean]) =>
      "Client value: " + bool
    }
    lazy val sessionAssert = sessionAlwaysTrue.map("Session value: " + _)

    override lazy val main: ClientDiscreteBehavior[List[String]] =
      clientAssert.discreteMap2(sessionAssert.toClient)(fun { (c: Rep[String], s: Rep[String]) =>
        List(c, s)
      })
  }

}

class MtFrpProgRunnerTest extends FunSuite with SimpleRoutingApp {
  test("This should run without errors") {
    def testRoute = PageCompiler.makeRoute()(Test.prog)(GenTestRunnerLib(Test.prog))("test")

    val ec = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(1))
    implicit val system = ActorSystem("simple-apps", None, None, Some(ec))

    startServer("0.0.0.0", port = 8080)(
      getFromResourceDirectory("")
        ~ testRoute
    )
  }
}