package mtfrp.lang

import scala.js.exp.JSExp
import frp.core.{ Event => SEvent }
import frp.core.Behavior
import frp.core.{ EventSource => SEventSource }
import frp.core.TickContext.globalTickContext
import spray.json._

trait ReplicationFRPLib
    extends ClientFRPLib
    with ServerFRPLib
    with JSJsonFormatLib
    with EventSources {

  implicit class EventToServer[T: JsonReader: JSJsonWriter: Manifest](evt: ClientEvent[T]) {
    def toServer: ServerEvent[(Client, T)] = {
      val source = SEventSource.concerning[(Client, T)]
      val toServerDep = new ToServerDependency(evt.rep, source)
      ServerEvent(source, evt.core.addToServerDependencies(toServerDep))
    }

    def toServerAnon: ServerEvent[T] = evt.toServer.map(_._2)
  }

  implicit class EventToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[Client => Option[T]]) {
    def toClient: ClientEvent[T] = {
      val source = FRP.eventSource[T](globalContext)
      val toClientDep = new ToClientDependency(evt.rep, source)
      ClientEvent(source, evt.core.addToClientDependencies(toClientDep))
    }
  }

  implicit class EventToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[T]) {
    def toAllClients: ClientEvent[T] = evt.map { t =>
      c: Client => Some(t)
    }.toClient
  }

  implicit class BehaviorToClient[T: JsonWriter: JSJsonReader: Manifest](beh: ServerBehavior[Client => T]) {
    def toClient: ClientBehavior[T] = {
      def insertCurrentState(client: Client) = {
        val ticket = beh.rep.markExit
        unit(ticket.now()(client).toJson.compactPrint)
      }
      val currentState = delayForClient(insertCurrentState).convertToRep[T]
      val targetedChanges = beh.changes.map { fun =>
        client: Client => Some(fun(client))
      }
      targetedChanges.toClient.hold(currentState)
    }
  }

  implicit class BehaviorToAllClients[T: JsonWriter: JSJsonReader: Manifest](beh: ServerBehavior[T]) {
    def toAllClients: ClientBehavior[T] =
      beh.map { t => c: Client => t }.toClient
  }

  implicit class IncBehaviorToClient[D: JsonWriter: JSJsonReader: Manifest, T: JsonWriter: JSJsonReader: Manifest](beh: ServerIncBehavior[Client => D, Client => T]) {
    def toClient(app: ClientDeltaApplicator[T, D]): ClientIncBehavior[D, T] = {
      def insertCurrentState(client: Client) = {
        val ticket = beh.rep.markExit
        unit(ticket.now()(client).toJson.compactPrint)
      }
      val currentState = delayForClient(insertCurrentState).convertToRep[T]
      val targetedChanges = beh.increments.map { fun =>
        client: Client => Some(fun(client))
      }
      targetedChanges.toClient.incFold(currentState)(app)
    }
  }

  implicit class IncBehaviorToAllClients[D: JsonWriter: JSJsonReader: Manifest, T: JsonWriter: JSJsonReader: Manifest](beh: ServerIncBehavior[D, T]) {
    // TODO: REWRITE WHEN MAP IS IMPLEMENTED ON INCs
    def toAllClients(app: ClientDeltaApplicator[T, D]): ClientIncBehavior[D, T] = {
      val currentState = unit(beh.rep.markExit.now().toJson.compactPrint).convertToRep[T]
      val increments = beh.increments
      increments.toAllClients.incFold(currentState)(app)
    }
  }
}
