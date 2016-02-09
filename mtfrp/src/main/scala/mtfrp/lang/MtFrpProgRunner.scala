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

  def preEngineOperations() = ()
  def postEngineOperations(main: ClientDiscreteBehavior[Main], serverEngine: Engine, clientEngine: Rep[ScalaJs[Engine]]) = ()

  private[mtfrp] def run(implicit f: ActorRefFactory): (Rep[Any], Option[Route], Engine) = {

    preEngineOperations()

    val executedMain = this.main()

    val clientMain = executedMain.rep
    val core = executedMain.core

    val clientQueues = buildClientQueues(core)

    // compile the FRP networks (this has all the bottom nodes of the graph)
    val serverEngine = Engine.compile(
      core.serverCarrier +: serverExitEvents,
      core.initialCarrier +: clientQueues +: serverExitBehaviors
    )

    val clientEngine = EngineRep.compile(
      ScalaJsRuntime.encodeListAsSeq(core.clientCarrier :: clientExitEvents),
      ScalaJsRuntime.encodeListAsSeq(clientMain :: clientExitBehaviors)
    )

    postEngineOperations(executedMain, serverEngine, clientEngine)

    val routeMaker = new RouteCreator(core, serverEngine, clientEngine, clientQueues)
    (clientMain, routeMaker.makeRoute(), serverEngine)
  }

  private[this] def buildClientQueues(core: ReplicationCore) = {
    val queueSnapshotter = core.serverCarrier.map { clientMessageFun => map: Map[Client, ClientStatus] =>
      map.map {
        case (client, status) => (client, status, clientMessageFun)
      }
    }
    val queueEvents = rawClientStatus.snapshotWith(queueSnapshotter)

    val clientQueues: HBehavior[Map[Client, List[Client => Seq[Message]]]] =
      queueEvents.fold(Map.empty[Client, List[Client => Seq[Message]]]) { (currentQueue, eventMap) =>
        // Each event affects the queue
        eventMap.foldLeft(currentQueue) { (queue, event) =>
          val (client, clientStatus, clientMessageFunction) = event
          clientStatus match {
            // The client is in its 'created' phase -> queue gets expanded
            case Created(client) =>
              val updatedQueueValue = clientMessageFunction :: queue.get(client).getOrElse(Nil)
              queue + (client -> updatedQueueValue)
            // The client is in its 'connected' phase -> queue gets reset
            case Connected(client) =>
              queue + (client -> Nil)
            // The client is in its 'disconnected' phase -> queue gets removed
            case Disconnected(client) =>
              queue - client
          }
        }
      }
    clientQueues
  }
}
