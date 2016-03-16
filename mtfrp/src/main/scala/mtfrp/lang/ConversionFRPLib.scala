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
    def toApplication: ApplicationEvent[Map[Client, T]] =
      clientStatus.sampledWith(evt.rep) { (clients, partialClientFun) =>
        val newClients = clients.map { client =>
          client -> partialClientFun(client)
        }
        newClients.collect { case (client, Some(t)) => (client, t) }.toMap
      }
    def toAppAnon: ApplicationEvent[List[T]] = toApplication.map(_.values.toList)
  }

  // toSession
  implicit class EventApplicationToSession[T](evt: ApplicationEvent[T]) {
    def toSession: SessionEvent[T] = SessionEvent(evt.map { t => c: Client => Some(t) })
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

  implicit class IncrementalBehaviorApplicationToSession2[T, DeltaT](beh: ApplicationIncBehavior[T, DeltaT]) {
    def toSession: SessionIncBehavior[T, DeltaT] = {
      val sessDeltas = beh.deltas.toSession
      SessionDiscreteBehavior(beh.map { x => c: Client => x }).withDeltas(beh.rep.initial, sessDeltas)
    }
  }

  private def clientThunk[T]: T => Client => T = t => c => t
}
