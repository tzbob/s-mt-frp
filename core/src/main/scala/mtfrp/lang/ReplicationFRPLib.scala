package mtfrp.lang

import frp.core.{ Event => SEvent }
import frp.core.Behavior
import frp.core.{ EventSource => SEventSource }
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
      val source = FRP.eventSource[T](FRP.global)
      val toClientDep = new ToClientDependency(evt.rep, source)
      ClientEvent(source, evt.core.addToClientDependencies(toClientDep))
    }
  }

  implicit class EventToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[T]) {
    def toAllClients: ClientEvent[T] = evt.map { t =>
      c: Client => Some(t)
    }.toClient
  }

  // obvious problem; behavior starts off as an empty map
  // while the view of a client is written based on the map
  // this view has to incorporate the fact that the map is empty -- counterintuitive
  implicit class BehaviorToServer[T: JsonReader: JSJsonWriter: Manifest](beh: ClientBehavior[T]) {
    def toServer: ServerBehavior[Map[Client, T]] = {
      beh.changes.toServer.fold(Map.empty[Client, T]) { _ + _ }
    }
  }

  implicit class BehaviorToClient[T: JsonWriter: JSJsonReader: Manifest](beh: ServerBehavior[Client => T]) {
    def toClient: ClientBehavior[T] = {
      val ticket = beh.rep.markExit
      def insertCurrentState(client: Client) = {
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
      val ticket = beh.rep.markExit
      def insertCurrentState(client: Client) = {
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
      val ticket = beh.rep.markExit
      def insertCurrentState() = {
        unit(ticket.now().toJson.compactPrint)
      }
      val currentState = delay(insertCurrentState).convertToRep[T]
      val increments = beh.increments

      increments.toAllClients.incFold(currentState)(app)
    }
  }
}
