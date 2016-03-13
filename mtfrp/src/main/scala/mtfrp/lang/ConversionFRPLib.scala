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
    def toAppAnon: ApplicationEvent[List[T]] = toApplication.map(_.values.toList)
  }

  // toSession
  implicit class EventApplicationToSession[T](evt: ApplicationEvent[T]) {
    def toSession: SessionEvent[T] = {
      SessionEvent(clientStatus.sampledWith(evt) { (clients, ts) =>
        clients.map(_ -> ts).toMap
      })
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

  implicit class IncrementalBehaviorApplicationToSession2[T, DeltaT](beh: ApplicationIncBehavior[T, DeltaT]) {
    def toSession: SessionIncBehavior[T, DeltaT] = {
      val sessDeltas = beh.deltas.toSession
      SessionDiscreteBehavior(beh.map { x => c: Client => x }).withDeltas(beh.rep.initial, sessDeltas)
    }
  }

  // // toSession
  // implicit class IncrementalBehaviorApplicationToSession[T, DeltaT](beh: ApplicationIncBehavior[Client => T, Client => Option[DeltaT]]) {

  //   /**
  //    * Convert between an Application incremental behavior and a Session incremental behavior
  //    *
  //    * @return
  //    */
  //   def toSession: SessionIncBehavior[T, DeltaT] = {
  //     val sessionDeltas = SessionFilterConversion.toSession(beh.deltas)
  //     val sessionBehavior = new DiscreteBehaviorApplicationToSession(beh).toSession

  //     sessionBehavior.withDeltas(beh.initial, sessionDeltas)
  //   }
  // }

  private def clientThunk[T]: T => Client => T = t => c => t
}
