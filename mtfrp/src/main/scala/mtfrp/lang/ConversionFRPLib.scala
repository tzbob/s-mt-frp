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

  // Behavior (server)-tier conversions

  // toApplication
  implicit class BehaviorSessionToApplication[T](beh: SessionBehavior[T]) {
    def toApplication: ApplicationBehavior[Map[Client, T]] = {
      clientStatus.map2(beh.rep) { (clients, clientFun) =>
        clients.map { c => c -> clientFun(c) }.toMap
      }
    }
  }

  // toSession
  implicit class BehaviorApplicationToSession[T](beh: ApplicationBehavior[T]) {
    def toSession: SessionBehavior[T] = SessionBehavior(beh.map { t => c: Client => t })
  }


  // Discrete Behavior (server)-tier conversions

  // toApplication
  implicit class DiscreteBehaviorSessionToApplication[T](beh: SessionDiscreteBehavior[T]) {
    /**
     * Convert between a Session discrete behavior and an Application discrete behavior
     *
     * @return
     */
    def toApplication: ApplicationDiscreteBehavior[Map[Client, T]] = {
      clientStatus.discreteMap2(beh.rep) { (clients, clientFun) =>
        clients.map { c => c -> clientFun(c) }.toMap
      }
    }
  }

  // toSession
  implicit class DiscreteBehaviorApplicationToSession[T](beh: ApplicationDiscreteBehavior[T]) {
    /**
     * Convert between an Application discrete behavior and a Session discrete behavior
     *
     * @return
     */
    def toSession: SessionDiscreteBehavior[T] = SessionDiscreteBehavior(beh.map { t => c: Client => t })
  }

  // Incremental Behavior (server)-tier conversions

  implicit class IncrementalBehaviorSessionToApplication[T, TD](beh: SessionIncBehavior[T, TD]) {
    def toApplication: ApplicationIncBehavior[Map[Client, T], (Client => Option[TD], Option[ClientChanges])] = {
      val newDeltas = beh.rep.deltas.unionWith(clientChanges) { clientFun =>
        ((c: Client) => clientFun(c), None: Option[ClientChanges])
      } { clientChange =>
        ((c: Client) => None, Some(clientChange))
      } { (clientFun, c) => (clientFun, Some(c))
      }

      val appDisc = new DiscreteBehaviorSessionToApplication(beh).toApplication
      appDisc.withDeltas(Map.empty[Client, T], newDeltas)
    }
  }

  implicit class IncrementalBehaviorApplicationToSession2[T, DeltaT](beh: ApplicationIncBehavior[T, DeltaT]) {
    def toSession: SessionIncBehavior[T, DeltaT] = {
      val sessDeltas = beh.deltas.toSession
      SessionDiscreteBehavior(beh.map { x => c: Client => x }).withDeltas(beh.rep.initial, sessDeltas)
    }
  }

  private def clientThunk[T]: T => Client => T = t => c => t
}
