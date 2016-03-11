package mtfrp.lang

import hokko.core.Engine
import scala.js.exp.FFIExp

abstract class TestRunnerLib[TestData: Manifest] extends MtFrpProgRunner with FFIExp {

  case class Assertion(left: Any, right: Any, conditional: Boolean, line: String, enclosing: String) extends Adt
  private def AssertionRep = adt[Assertion]
  private implicit def asOps(p: Rep[Assertion]) = adtOps(p)

  implicit class AssertionCheck[A: Manifest](left: Rep[A]) {
    def ===(right: Rep[A])(implicit line: sourcecode.Line, enclosing: sourcecode.Enclosing): Rep[Assertion] =
      assert(left, right, left == right)
  }

  def assert[A](left: Rep[A], right: Rep[A], condition: Rep[Boolean])(implicit line: sourcecode.Line, enclosing: sourcecode.Enclosing): Rep[Assertion] =
    AssertionRep(left, right, condition, line.toString, enclosing.toString)

  override type Main = Assertion

  private def draw(assertion: Rep[Assertion]) = {
    val string = "In " + assertion.enclosing  + " on " + assertion.line + " the assertion of " + assertion.left + " == " + assertion.right + " was: " + assertion.conditional
    if (assertion.conditional) println(string)
    else println(">>> " + string)
  }

  def inputList: Rep[List[TestData]]

  private[this] lazy val rawInput = EventRep.source[TestData]
  lazy val input = ClientEvent(rawInput, ReplicationCore.empty)

  override def clientExitEvents = input.map(Drep("| Input Value: ")).rep :: super.clientExitEvents

  private def Drep[A](descr: Rep[String] = "")(a: Rep[A]): Rep[A] = {
    println(descr + a)
    a
  }

  override def postEngineOperations(main: ClientDiscreteBehavior[Assertion], serverEngine: Engine, clientEngine: Rep[ScalaJs[Engine]]) = {
    val clientState = clientEngine.askCurrentValues()

    println("| Initial Draw")
    ScalaJsRuntime.decodeOptions(clientState(main.rep)).foreach(draw)

    clientEngine.subscribeForPulses(ScalaJsRuntime.encodeFn1(fun { (pulses: Rep[ScalaJs[Engine.Pulses]]) =>
      ScalaJsRuntime.decodeOptions(pulses(main.rep.changes)).foreach(draw)
    }))

    val f = () => inputList.foreach { testData =>
      clientEngine.fire(ScalaJsRuntime.encodeListAsSeq(List(ScalaJsRuntime.encodeTup2(rawInput -> testData))))
    }
    foreign"window.setTimeout($f, 1000)".withEffect()
  }
}
