package mtfrp.lang

import hokko.core.{Behavior, Engine}
import spray.json._

trait ConversionFRPLib
  extends ClientFRPLib
    with ServerFRPLib
    with SessionFRPLib {

  // Event (server)tier-conversions

  // toApplication
  implicit class EventSessionToApplication[T](evt: SessionEvent[T]) {
    /**
      * Convert between a Session event and an Application event
      *
      * @return
      */
    def toApplication: ApplicationEvent[Map[Client, T]] = evt.rep
  }

  // toSession
  // TODO: Track current clients somehow somewhere!
  val currentClients: ApplicationBehavior[Set[Client]] = ???

  implicit class EventApplicationToSession[T](evt: ApplicationEvent[Client => Option[T]]) {
    /**
      * Convert between an Application event and a Session event
      *
      * This function will evaluate the function within `this` on every pulse for all the currently active clients in
      * order to make a Session event
      *
      * @return
      */
    def toSession: SessionEvent[T] = {
      val mapMaker = evt.map { cf =>
        clients: Set[Client] =>
          clients.foldLeft(Map.empty[Client, T]) { (clientToT, client) =>
            val optT = cf(client)
            val expandedMapOpt = optT.map(t => clientToT + (client -> t))
            expandedMapOpt.getOrElse(clientToT)
          }
      }
      SessionEvent(currentClients.snapshotWith(mapMaker))
    }
  }

  // Discrete Behavior (server)-tier conversions

  // toSession
  implicit class DiscreteBehaviorApplicationToSession[T](beh: ApplicationDiscreteBehavior[Client => T]) {
    /**
      * Convert between an Application discrete behavior and a Session discrete behavior
      *
      * @return
      */
    def toSession: SessionDiscreteBehavior[T] = SessionDiscreteBehavior(beh)
  }

  // Incremental Behavior (server)-tier conversions

  // toSession
  implicit class IncrementalBehaviorApplicationToSession[T, DeltaT](beh: ApplicationIncBehavior[Client => T,
    Client => Option[DeltaT]]) {

    /**
      * Convert between an Application incremental behavior and a Session incremental behavior
      *
      * @return
      */
    def toSession: SessionIncBehavior[T, DeltaT] = {
      val sessionDeltas = beh.deltas.toSession
      val sessionBehavior = new DiscreteBehaviorApplicationToSession(beh).toSession

      sessionBehavior.withDeltas(beh.rep.initial, sessionDeltas)
    }
  }

  private def clientThunk[T]: T => Client => T = t => c => t
}
