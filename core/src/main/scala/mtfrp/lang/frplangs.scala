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
  def main: ClientDiscreteBehavior[HtmlNode]
}

trait MtFrpProgRunner extends MtFrpProgExp { self: MtFrpProg =>
  private[mtfrp] def run: (Rep[DiscreteBehavior[HtmlNode]], Option[Route]) = {
    val behavior = main

    val rep = behavior.rep
    val core = behavior.core

    // compile the FRP networks (this has all the bottom nodes of the graph)
    val serverEngine = Engine.compile(core.serverCarrier)()
    val clientEngine = EngineRep.compile(List(core.clientCarrier))(List(rep))

    // populate the document body asap
    val clientState = clientEngine.askCurrentValues()
    clientState(rep).foreach { (initialState: Rep[HtmlNode]) =>
      val rootElem = createElement(initialState)
      document.body.appendChild(rootElem)

      var currentNode = initialState
      clientEngine.subscribeForPulses { (pulses: Rep[Engine.Pulses]) =>
        pulses(rep.changes).foreach { (change: Rep[HtmlNode]) =>
          val delta = diff(currentNode, change)
          currentNode = change
          patch(rootElem, delta)
        }
      }
      () // explicitly mark a unit function for Rep[Unit]
    }

    val routeMaker = new RouteCreator(core, serverEngine, clientEngine)
    (rep, routeMaker.makeRoute())
  }
}
