package mtfrp.lang

import hokko.core.{DiscreteBehavior, Engine}
import mtfrp.exp.MtFrpProgExp
import scala.js.language._
import scala.js.language.dom.Browser
import spray.json.DefaultJsonProtocol
import spray.routing.Route

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
  extends MtFrpLib
  with FrpExtensions
  with Browser
  with Adts
  with DocumentOpsExtended
  with DefaultJsonProtocol
  with HtmlNodeLib
  with JS {
  def main: ClientDiscreteBehavior[Html]
}

trait MtFrpProgRunner extends MtFrpProgExp { self: MtFrpProg =>
  private[mtfrp] def run: (Rep[Any], Option[Route], Engine) = {
    val behavior = main

    val rep = behavior.rep
    val core = behavior.core

    // compile the FRP networks (this has all the bottom nodes of the graph)
    val serverEngine = Engine.compile(Seq(core.serverCarrier), Seq.empty)
    val clientEngine = EngineRep.compile(
      ScalaJsRuntime.encodeListAsSeq(List(core.clientCarrier)),
      ScalaJsRuntime.encodeListAsSeq(List(rep))
    )

    // initial population of the DOM
    val clientState = clientEngine.askCurrentValues()
    clientState(rep).decode.foreach { (initialNodeMaker: Rep[Html]) =>
      // Creat the root element
      val initialNode = initialNodeMaker(clientEngine)
      val rootElem = createElement(initialNode)
      document.body.appendChild(rootElem)

      // Create differences and patch them on the root element
      var currentNode = initialNode
      clientEngine.subscribeForPulses(fun { (pulses: Rep[ScalaJs[Engine.Pulses]]) =>
        pulses(rep.changes).decode.foreach { (nodeMaker: Rep[Html]) =>
          val changedNode = nodeMaker(clientEngine)
          val delta = diff(currentNode, changedNode)
          currentNode = changedNode
          patch(rootElem, delta)
        }
      }.encode)
      () // explicitly mark a unit function for Rep[Unit]
    }

    val routeMaker = new RouteCreator(core, serverEngine, clientEngine)
    (rep, routeMaker.makeRoute(), serverEngine)
  }
}
