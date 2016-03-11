package mtfrp.lang

import hokko.core.{Behavior, Engine}

trait ConversionFRPLib
  extends ClientFRPLib
  with ServerFRPLib
  with SessionFRPLib { self: ReplicationCoreLib =>

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
  implicit class EventApplicationToSession[T](evt: ApplicationEvent[Client => Option[T]]) {
    /**
     * Convert between an Application event and a Session event
     *
     * This function evaluates the function within `this` on every pulse for all the currently active clients in
     * order to make a Session event
     *
     * @return
     */
    def toSession: SessionEvent[T] = {
      val mapMaker = evt.map { cf => clients: Set[Client] =>
        clients.foldLeft(Map.empty[Client, T]) { (clientToT, client) =>
          val optT = cf(client)
          val expandedMapOpt = optT.map(t => clientToT + (client -> t))
          expandedMapOpt.getOrElse(clientToT)
        }
      }
      SessionEvent(clientStatus.snapshotWith(mapMaker))
    }
  }

  // Discrete Behavior (server)-tier conversions

  // toApplication
  implicit class DiscreteBehaviorSessionToApplication[T](beh: SessionDiscreteBehavior[T]) {
    /**
     * Convert between a Session discrete behavior and an Application discrete behavior
     *
     * @return
     */
    def toApplication: ApplicationDiscreteBehavior[Client => T] = {
      // TODO !
      ???
    }
  }

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

  object FRPConversion {
    def toSession[T, DeltaT, C, DeltaC](
      beh: ApplicationIncBehavior[T, Option[DeltaT]])(
      valueNarrow: (Client, T) => C)(
      deltaNarrow: (Client, DeltaT) => Option[DeltaC])(
      narrowFold: (Client, C, DeltaC) => C
    ): SessionIncBehavior[T, DeltaT] = {
      ???
    }
  }

  implicit class IncrementalBehaviorApplicationToSession2[T, DeltaT](beh: ApplicationIncBehavior[T, DeltaT]) {
    def toSession: SessionIncBehavior[T, DeltaT] = ???
    }

  // toSession
  implicit class IncrementalBehaviorApplicationToSession[T, DeltaT](beh: ApplicationIncBehavior[Client => T, Client => Option[DeltaT]]) {

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
