package mtfrp.lang

import akka.actor._
import hokko.core.{ Behavior => HBehavior, Event => HEvent, Engine }
import mtfrp.exp.MtFrpProgExp
import spray.routing.{ Route, Directives }
import spray.routing.Directives._

trait MtFrpProgRunner extends MtFrpProgExp { self: MtFrpProg =>
  def serverExitEvents: Seq[HEvent[_]] = Seq.empty
  def serverExitBehaviors: Seq[HBehavior[_]] = Seq.empty

  def clientExitEvents: Rep[List[ScalaJs[HEvent[Any]]]] = List()
  def clientExitBehaviors: Rep[List[ScalaJs[HBehavior[Any]]]] = List()

  private[mtfrp] def run(implicit f: ActorRefFactory): (Rep[Any], Option[Route], Engine) = {
    val behavior = main

    val rep = behavior.rep
    val core = behavior.core

    // compile the FRP networks (this has all the bottom nodes of the graph)
    val serverEngine = Engine.compile(
      core.serverCarrier +: serverExitEvents,
      core.initialCarrier +: serverExitBehaviors
    )
    val clientEngine = EngineRep.compile(
      ScalaJsRuntime.encodeListAsSeq(core.clientCarrier :: clientExitEvents),
      ScalaJsRuntime.encodeListAsSeq(rep :: clientExitBehaviors)
    )

    // initial population of the DOM
    val clientState = clientEngine.askCurrentValues()
    ScalaJsRuntime.decodeOptions(clientState(rep)).foreach { (initialNodeMaker: Rep[Html]) =>
      // Creat the root element
      val initialNode = initialNodeMaker(clientEngine)
      val rootElem = createElement(initialNode)
      document.body.appendChild(rootElem)

      // Create differences and patch them on the root element
      var currentNode = initialNode
      clientEngine.subscribeForPulses(ScalaJsRuntime.encodeFn1(fun { (pulses: Rep[ScalaJs[Engine.Pulses]]) =>
        ScalaJsRuntime.decodeOptions(pulses(rep.changes)).foreach { (nodeMaker: Rep[Html]) =>
          val changedNode = nodeMaker(clientEngine)
          val delta = diff(currentNode, changedNode)
          currentNode = changedNode
          patch(rootElem, delta)
        }
      }))
      () // explicitly mark a unit function for Rep[Unit]
    }

    val routeMaker = new RouteCreator(core, serverEngine, clientEngine)
    (rep, routeMaker.makeRoute(), serverEngine)
  }
}
