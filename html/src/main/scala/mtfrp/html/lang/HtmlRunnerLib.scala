package mtfrp.html.lang

import hokko.core.Engine
import mtfrp.html.exp.{DocumentOpsExtendedExp, HtmlNodeBuilderLibExp}
import mtfrp.lang.MtFrpProgRunner
import scala.js.exp.dom.BrowserExp

trait HtmlRunnerLib
  extends MtFrpProgRunner
  with HtmlNodeLib
  with HtmlNodeBuilderLibExp
  with DocumentOpsExtendedExp {

  override type Main = Html

  override def postEngineOperations(main: ClientDiscreteBehavior[Main], serverEngine: Engine, clientEngine: Rep[ScalaJs[Engine]]) = {
    val rep = main.rep

    // initial population of the DOM
    val clientState = clientEngine.askCurrentValues()
    ScalaJsRuntime.decodeOptions(clientState(rep)).foreach { (initialNodeMaker: Rep[Html]) =>
      // Creat the root element
      val initialNode = initialNodeMaker(clientEngine)
      val rootElem = createElement(initialNode)
      document.body.appendChild(rootElem)

      // Create differences and patch the root element
      var currentNode = initialNode
      clientEngine.subscribeForPulses(ScalaJsRuntime.encodeFn1(fun { (pulses: Rep[ScalaJs[Engine.Pulses]]) =>
        val pulsesOpt = ScalaJsRuntime.decodeOptions(pulses(rep.changes))
        pulsesOpt.foreach { (nodeMaker: Rep[Html]) =>
          val changedNode = nodeMaker(clientEngine)
          val delta = diff(currentNode, changedNode)
          currentNode = changedNode
          patch(rootElem, delta)
        }
      }))
      () // explicitly mark a unit function for Rep[Unit]
    }
  }
}
