package mtfrp.lang

import akka.actor._
import hokko.core.{Behavior => HBehavior, Event => HEvent, Engine}
import mtfrp.exp.MtFrpProgExp
import spray.routing.{Route, Directives}
import spray.routing.Directives._

trait MtFrpProgRunner
  extends MtFrpProgExp
  with RouteCreatorLib { self: MtFrpProg =>

  def serverExitEvents: Seq[HEvent[_]] = Seq.empty
  def serverExitBehaviors: Seq[HBehavior[_]] = Seq.empty

  def clientExitEvents: Rep[List[ScalaJs[HEvent[Any]]]] = List()
  def clientExitBehaviors: Rep[List[ScalaJs[HBehavior[Any]]]] = List()

  def preEngineOperations(main: ClientDiscreteBehavior[Main]) = ()
  def postEngineOperations(main: ClientDiscreteBehavior[Main], serverEngine: Engine, clientEngine: Rep[ScalaJs[Engine]]) = ()

  private[mtfrp] def run(implicit f: ActorRefFactory): (Rep[Any], Option[Route], Engine) = {

    val executedMain = this.main()

    preEngineOperations(executedMain)

    val clientMain = executedMain.rep
    val core = executedMain.core

    // compile the FRP networks (this has all the bottom nodes of the graph)
    val serverEngine = Engine.compile(
      core.serverCarrier +: serverExitEvents,
      core.serverInitialCarrier +: serverExitBehaviors
    )

    val clientEngine = EngineRep.compile(
      ScalaJsRuntime.encodeListAsSeq(core.clientCarrier :: clientExitEvents),
      ScalaJsRuntime.encodeListAsSeq(clientMain :: clientExitBehaviors)
    )

    postEngineOperations(executedMain, serverEngine, clientEngine)

    val routeMaker = new RouteCreator(core, serverEngine, clientEngine)
    (clientMain, routeMaker.makeRoute(), serverEngine)
  }
}
