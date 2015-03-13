package mtfrp.lang

import hokko.core.Engine
import spray.json._

trait ReplicationFRPLib
  extends ClientFRPLib
  with ServerFRPLib
  with JSJsonFormatLib
  with EventSources {

  implicit class EventToServer[T: JsonReader: JSJsonWriter: Manifest](evt: ClientEvent[T]) {
    def toServer: ServerEvent[(Client, T)] = {
      val source = hokko.core.Event.source[(Client, T)]
      val toServerDep = new ToServerDependency(evt.rep, source)
      ServerEvent(source, evt.core + toServerDep)
    }
    def toServerAnon: ServerEvent[T] = evt.toServer.map(_._2)
  }

  implicit class EventToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[Client => Option[T]]) {
    def toClient: ClientEvent[T] = {
      val source = EventRep.source[T]
      val toClientDep =
        new ToClientDependency(exit = evt.rep, entry = source)
      ClientEvent(source, evt.core + toClientDep)
    }
  }

  implicit class EventToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[T]) {
    def toAllClients: ClientEvent[T] = evt.map { t =>
      c: Client => Some(t)
    }.toClient
  }

  implicit class DiscreteBehaviorToClient[T: JsonWriter: JSJsonReader: Manifest](beh: ServerDiscreteBehavior[Client => T]) {
    def toClient: ClientDiscreteBehavior[T] = {
      def calculateCurrentState(c: Client, e: Engine): T = {
        val values = e.askCurrentValues()
        val current = values(beh.rep)
        if (current.isDefined) current.get(c)
        else throw new RuntimeException(s"${beh.rep} is not present in $e")
      }

      val source = EventRep.source[T]
      val currentState = delay(calculateCurrentState)
      val behavior = source.hold(currentState)

      val optionalChanges = beh.rep.changes.map { fun =>
        c: Client => Some(fun(c))
      }

      val toClientDep =
        new ToClientDependency(Some(beh.rep), optionalChanges, source)

      ClientDiscreteBehavior(behavior, beh.core + toClientDep)
    }
  }

  implicit class DiscreteBehaviorToAllClients[T: JsonWriter: JSJsonReader: Manifest](beh: ServerDiscreteBehavior[T]) {
    def toAllClients: ClientDiscreteBehavior[T] =
      beh.map { t => c: Client => t }.toClient
  }

  // implicit class IncBehaviorToClient[D: JsonWriter: JSJsonReader: Manifest, T: JsonWriter: JSJsonReader: Manifest](beh: ServerIncBehavior[Client => D, Client => T]) {
  //   def toClient(app: ClientDeltaApplicator[T, D]): ClientIncBehavior[D, T] = {
  //     val ticket = beh.rep.markExit
  //     def insertCurrentState(client: Client) = {
  //       unit(ticket.now()(client).toJson.compactPrint)
  //     }
  //     val currentState = delayForClient(insertCurrentState).convertToRep[T]
  //     val targetedChanges = beh.increments.map { fun =>
  //       client: Client => Some(fun(client))
  //     }
  //     targetedChanges.toClient.incFold(currentState)(app)
  //   }
  // }

  // implicit class IncBehaviorToAllClients[D: JsonWriter: JSJsonReader: Manifest, T: JsonWriter: JSJsonReader: Manifest](beh: ServerIncBehavior[D, T]) {
  //   // TODO: REWRITE WHEN MAP IS IMPLEMENTED ON INCs
  //   def toAllClients(app: ClientDeltaApplicator[T, D]): ClientIncBehavior[D, T] = {
  //     val ticket = beh.rep.markExit
  //     def insertCurrentState() = {
  //       unit(ticket.now().toJson.compactPrint)
  //     }
  //     val currentState = delay(insertCurrentState).convertToRep[T]
  //     val increments = beh.increments

  //     increments.toAllClients.incFold(currentState)(app)
  //   }
  // }
}
