package mtfrp.lang

import hokko.core.{Behavior, Engine}

import io.circe.Decoder
import io.circe.Encoder

trait ReplicationFRPLib
  extends ClientFRPLib
  with ServerFRPLib
  with SessionFRPLib
  with ConversionFRPLib
  with JSJsonFormatLib
  with EventSources {

  // Event Replications

  // toServer
  implicit class EventToServer[T: Decoder: JSJsonWriter: Manifest](evt: ClientEvent[T]) {
    /**
     * Replicate a Client event onto the Session tier (Session event)
     */
    def toServer: SessionEvent[T] = {
      val source = hokko.core.Event.source[(Client, T)]
      val toServerDep = new ToServerDependency(evt.rep, source)
      val appEvent = ApplicationEvent(source, evt.core + toServerDep)
      val mapAppEvent = appEvent.map(Map.empty[Client, T] + _)
      SessionEvent(mapAppEvent)
    }

    /**
      * Replicate a Client event directly onto the Application tier, discarding its identity
      */
    def toServerAnon: ApplicationEvent[T] = {
      val sessionEvent = evt.toServer
      val appEvent = sessionEvent.toApplication
      // This is fine since we know that we're coming from a client event
      appEvent.map { evtMap => evtMap.collectFirst { case (_, v) => v }.getOrElse(???) }
    }
  }

  // toClient
  implicit class EventToClient[T: Encoder: JSJsonReader: Manifest](evt: SessionEvent[T]) {
    def toClient: ClientEvent[T] = {
      val toClientDep = ToClientDependency.update(evt.rep.rep.map(_.get _))
      ClientEvent(toClientDep.updateData.source, evt.rep.core + toClientDep)
    }
  }

  // toAllClients
  implicit class EventToAllClients[T: Encoder: JSJsonReader: Manifest](evt: ApplicationEvent[T]) {
    /**
     * Broadcast the application event to all clients
     *
     * @return
     */
    def toAllClients: ClientEvent[T] = evt.map { t => c: Client => Some(t) }.toSession.toClient
  }

  // Discrete Behavior Replications

  // toClient
  implicit class DiscreteBehaviorToClient[T: Encoder: JSJsonReader: Manifest](beh: SessionDiscreteBehavior[T]) {

    /**
     * Replicate a discrete Session behavior onto the client tier
     *
     */
    def toClient: ClientDiscreteBehavior[T] = {
      val toClientDep = ToClientDependency.stateUpdate(beh.rep.rep, beh.rep.rep.changes)

      val stateSource = toClientDep.stateData.map(_.source).getOrElse(EventRep.empty)
      val source = stateSource.unionLeft(toClientDep.updateData.source)

      // inject the `current` state, TODO: when this is executed we need to start caching pulses
      val currentState = delay(calculateCurrentState(beh.rep.rep))
      val behavior = source.hold(currentState.convertToRep[T])

      ClientDiscreteBehavior(behavior, beh.rep.core + toClientDep)
    }
  }

  // toAllClients
  implicit class DiscreteBehaviorToAllClients[T: Encoder: JSJsonReader: Manifest](beh: ApplicationDiscreteBehavior[T]) {
    def toAllClients: ClientDiscreteBehavior[T] = beh.map(clientThunk).toSession.toClient
  }

  // Incremental Behavior Replications

  // toClient
  implicit class IncBehaviorToClient[A: Encoder: JSJsonReader: Manifest, DeltaA: Encoder: JSJsonReader: Manifest](
    incBeh: SessionIncBehavior[A, DeltaA]
  ) {

    /**
     * Replicate a Session incremental behavior onto the Client tier (SessionIncBehavior)
     *
     * Replicates updates incrementally.
     *
     * @param clientFold client-side function that is used to re-construct the behavior client-side,
     * this should mimic its server-side behavior
     *
     */
    def toClient(clientFold: (Rep[A], Rep[DeltaA]) => Rep[A]): ClientIncBehavior[A, DeltaA] = {
      val appIncBeh = incBeh.rep
      val toClientDep = ToClientDependency.stateUpdate(appIncBeh.rep, appIncBeh.rep.deltas)

      val stateSource = toClientDep.stateData.map(_.source).getOrElse(EventRep.empty)
      val updateSource = toClientDep.updateData.source

      def mkFn1[F: Manifest](f: Rep[F] => Rep[(Option[A], Option[DeltaA])]): Rep[ScalaJs[F => (Option[A], Option[DeltaA])]] =
        ScalaJsRuntime.encodeFn1(fun(f))

      val f1 = mkFn1 { (x: Rep[A]) =>
        make_tuple2(some(x) -> none)
      }
      val f2 = mkFn1 { (x: Rep[DeltaA]) =>
        make_tuple2(none -> some(x))
      }

      val resettableSource = stateSource.unionWith(updateSource)(f1)(f2)(
        ScalaJsRuntime.encodeFn2 { (x: Rep[A], y: Rep[DeltaA]) =>
          make_tuple2(some(x) -> some(y))
        }
      )

      val currentState = delay(calculateCurrentState(appIncBeh.rep)).convertToRep[A]
      val incBehavior = resettableSource.fold(currentState)(
        ScalaJsRuntime.encodeFn2 { (acc: Rep[A], n: Rep[(Option[A], Option[DeltaA])]) =>
          val reset = n._1
          val update = n._2

          val resetEmpty = update.fold(acc, { updateData =>
            clientFold(acc, updateData)
          })

          reset.fold(resetEmpty, resetData => resetData)
        }
      )

      ClientIncBehavior(
        incBehavior.withDeltas(currentState, updateSource),
        appIncBeh.core + toClientDep
      )
    }
  }

  implicit class IncBehaviorToAllClients[A: Encoder: JSJsonReader: Manifest, DeltaA: Encoder: JSJsonReader: Manifest](
    behavior: ApplicationIncBehavior[A, DeltaA]
  ) {
    def toAllClients(clientFold: (Rep[A], Rep[DeltaA]) => Rep[A]): ClientIncBehavior[A, DeltaA] = {
      val mappedDeltas = behavior.deltas.map(Map.empty[Client, DeltaA].withDefaultValue)
      val mappedBehavior = behavior.map(clientThunk)
      val mappedInit = clientThunk(behavior.rep.initial)
      val mappedIncBehavior = mappedBehavior.withDeltas(mappedInit, mappedDeltas)
      SessionIncBehavior(mappedIncBehavior).toClient(clientFold)
    }
  }

  private def calculateCurrentState[T: Manifest](behavior: Behavior[Client => T])(client: Client, event: Engine): T = {
    val values = event.askCurrentValues()
    val current = values(behavior)
    if (current.isDefined) current.get(client)
    else throw new RuntimeException(s"${behavior} is not present in $event")
  }

  private def clientThunk[T]: T => Client => T = t => c => t
}
