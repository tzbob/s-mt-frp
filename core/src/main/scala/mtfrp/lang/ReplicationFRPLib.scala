package mtfrp.lang

import hokko.core.Engine
import hokko.core.Behavior
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
      val toClientDep = ToClientDependency.update(evt.rep)
      ClientEvent(toClientDep.updateData.source, evt.core + toClientDep)
    }
  }

  implicit class EventToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[T]) {
    def toAllClients: ClientEvent[T] = evt.map { t =>
      c: Client => Some(t)
    }.toClient
  }

  implicit class DiscreteBehaviorToClient[T: JsonWriter: JSJsonReader: Manifest](beh: ServerDiscreteBehavior[Client => T]) {
    def toClient: ClientDiscreteBehavior[T] = {
      val toClientDep = ToClientDependency.stateUpdate(beh.rep, beh.rep.changes)

      val stateSource = toClientDep.stateData.map(_.source).getOrElse(EventRep.empty)
      val source = stateSource.unionLeft(toClientDep.updateData.source)

      val currentState = delay(calculateCurrentState(beh.rep))
      val behavior = source.hold(currentState.convertToRep[T])

      ClientDiscreteBehavior(behavior, beh.core + toClientDep)
    }
  }

  implicit class DiscreteBehaviorToAllClients[T: JsonWriter: JSJsonReader: Manifest](beh: ServerDiscreteBehavior[T]) {
    def toAllClients: ClientDiscreteBehavior[T] = beh.map(clientThunk).toClient
  }

  implicit class IncBehaviorToClient[A: JsonWriter: JSJsonReader: Manifest, DeltaA: JsonWriter: JSJsonReader: Manifest](
    beh: ServerIncBehavior[Client => A, Client => DeltaA]
  ) {
    def toClient(clientFold: Rep[((A, DeltaA)) => A]): ClientIncBehavior[A, DeltaA] = {
      val toClientDep = ToClientDependency.stateUpdate(beh.rep, beh.rep.deltas)

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

      val currentState = delay(calculateCurrentState(beh.rep)).convertToRep[A]
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
        beh.core + toClientDep
      )
    }
  }

  implicit class IncBehaviorToAllClients[A: JsonWriter: JSJsonReader: Manifest, DeltaA: JsonWriter: JSJsonReader: Manifest](
    beh: ServerIncBehavior[A, DeltaA]
  ) {
    def toAllClients(clientFold: Rep[((A, DeltaA)) => A]): ClientIncBehavior[A, DeltaA] = {
      val mappedDeltas = beh.deltas.map(clientThunk)
      val mappedBehavior = beh.map(clientThunk)
      val mappedInit = clientThunk(beh.rep.initial)
      val mappedIncBehavior = mappedBehavior.withDeltas(mappedInit, mappedDeltas)
      System.out.println(mappedIncBehavior.rep)
      mappedIncBehavior.toClient(clientFold)
    }
  }

  private def calculateCurrentState[T: Manifest](beh: Behavior[Client => T])(c: Client, e: Engine): T = {
    val values = e.askCurrentValues()
    val current = values(beh)
    if (current.isDefined) current.get(c)
    else throw new RuntimeException(s"${beh} is not present in $e")
  }

  private def clientThunk[T]: T => Client => T = t => c => t

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
