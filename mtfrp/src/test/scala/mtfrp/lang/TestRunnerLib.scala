package mtfrp.lang

import hokko.core.Engine

abstract class TestRunnerLib[TestData: Manifest] extends MtFrpProgRunner {
  override type Main = List[String]

  def draw(lines: Rep[List[String]]) = {
    val line = "########################"
    println(line)
    lines.foreach(println)
  }

  def inputList: Rep[List[TestData]]

  private[this] lazy val rawInput = EventRep.source[TestData]
  lazy val input = ClientEvent(rawInput, ReplicationCore.empty)

  override def clientExitEvents = input.rep :: super.clientExitEvents

  override def postEngineOperations(main: ClientDiscreteBehavior[Main], serverEngine: Engine, clientEngine: Rep[ScalaJs[Engine]]) = {
    val clientState = clientEngine.askCurrentValues()

    ScalaJsRuntime.decodeOptions(clientState(main.rep)).foreach(draw)

    clientEngine.subscribeForPulses(ScalaJsRuntime.encodeFn1(fun { (pulses: Rep[ScalaJs[Engine.Pulses]]) =>
      ScalaJsRuntime.decodeOptions(pulses(main.rep.changes)).foreach(draw)
    }))

    inputList.foreach { testData =>
      clientEngine.fire(ScalaJsRuntime.encodeListAsSeq(List(ScalaJsRuntime.encodeTup2(rawInput -> testData))))
    }
  }
}
