package mtfrp.lang

import scala.language.existentials
import scala.language.implicitConversions
import scala.language.reflectiveCalls

import akka.pattern.ask
import hokko.core.{Behavior, Engine, Event => HEvent, EventSource => HEventSource, IncrementalBehavior}
import java.util.UUID
import scala.js.language._
import scala.virtualization.lms.common._
import spray.http.HttpHeaders._
import spray.http.MediaTypes._
import spray.routing.Directives._

import io.circe._
import io.circe.generic.auto._
import io.circe.parser._
import io.circe.syntax._

trait ReplicationCoreLib extends JSJsonFormatLib with EventSources
  with HEvent.EventLib with HEvent.EventStaticLib
  with Engine.EngineLib with Engine.EngineStaticLib
  with Engine.Pulses.PulsesLib with Engine.Values.ValuesLib
  with XMLHttpRequests with DelayedEval
  with JSMaps with ListOps with ListOps2 with TupleOps with OptionOps {

  trait ClientStatus { val client: Client }
  case class Created(client: Client) extends ClientStatus
  case class Connected(client: Client) extends ClientStatus
  case class Disconnected(client: Client) extends ClientStatus

  // TODO: make sure the pagecompiler pushes the 'created' status in here
  private[mtfrp] val rawClientEventSource = HEvent.source[ClientStatus]

  private[mtfrp] val rawClientStatus =
    rawClientEventSource.fold(Map.empty[Client, ClientStatus]) { (map, action) =>
      map.updated(action.client, action)
    }

  case class Message(name: String, json: String) extends Adt
  val MessageRep = adt[Message]

  trait ToClientDependency[Res, U] {
    val name = UUID.randomUUID.toString
    val updateData: ToClientDependency.UpdateData[U]
    val stateData: Option[ToClientDependency.StateData[Res]] = None
  }

  object ToClientDependency {
    private def tToMessage[F: Encoder](name: String)(t: F) = Message(name, t.asJson.noSpaces)

    class ReplicationData[A: JSJsonReader: Manifest] {
      val source: Rep[ScalaJs[HEventSource[A]]] = EventRep.source[A]

      val mkPulse: Rep[String => ScalaJs[(ScalaJs[HEventSource[A]], A)]] =
        fun { jsonPulse =>
          ScalaJsRuntime.encodeTup2(make_tuple2(source -> jsonPulse.convertToRep[A]))
        }
    }

    case class UpdateData[A: Encoder: JSJsonReader: Manifest](
      name: String,
      exit: HEvent[Client => Option[A]]
    ) extends ReplicationData[A] {
      val carrier: HEvent[Client => Option[Message]] = exit.map { fun => (c: Client) => fun(c).map(tToMessage[A](name))
      }
    }

    case class StateData[Init: Encoder: JSJsonReader: Manifest](
      name: String,
      behavior: Behavior[Client => Init]
    ) extends ReplicationData[Init] {
      val carrier: Behavior[Client => Message] = behavior.map { fun => c: Client => tToMessage(name)(fun(c))
      }
    }

    def update[U: Encoder: JSJsonReader: Manifest](exit: HEvent[Client => Option[U]]): ToClientDependency[U, U] =
      new ToClientDependency[U, U] {
        val updateData = UpdateData(name, exit)
      }

    def stateUpdate[Init: Encoder: JSJsonReader: Manifest, U: Encoder: JSJsonReader: Manifest](
      stateBehavior: Behavior[Client => Init],
      updates: HEvent[Client => U]
    ): ToClientDependency[Init, U] =
      new ToClientDependency[Init, U] {
        val updateData = UpdateData(name, updates.map { fun => c: Client => Some(fun(c))
        })
        override val stateData = Some(StateData(name, stateBehavior))
      }
  }

  class ToServerDependency[T: Decoder: JSJsonWriter: Manifest](
    exit: Rep[ScalaJs[HEvent[T]]],
    entry: HEventSource[(Client, T)]
  ) {
    val name = UUID.randomUUID.toString

    val messageCarrier: Rep[ScalaJs[HEvent[Message]]] =
      exit.map(ScalaJsRuntime.encodeFn1(fun { (t: Rep[T]) =>
        MessageRep(unit(name), t.toJSONString)
      }))

    def pulse(jsonPulse: String, clientId: String): (HEventSource[(Client, T)], (Client, T)) = {
      // TODO: Make this safe? Log the errors and ignore wrong formats?
      val newPulse = Client(clientId) -> decode[T](jsonPulse).toOption.get
      (entry, newPulse)
    }
  }

  object ReplicationCore {
    def empty = ReplicationCore()
    def merge(seq: Seq[ReplicationCore]) =
      seq.foldLeft(ReplicationCore.empty) { (acc, n) =>
        acc.+(n)
      }
  }

  type NamedServerPulseMaker = Map[String, (String, String) => (HEventSource[(Client, T)], (Client, T)) forSome { type T }]
  type NamedClientPulseMaker = Map[String, String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]

  case class ReplicationCore(
    toClientDeps: Set[ToClientDependency[_, _]] = Set.empty,
    toServerDeps: Set[ToServerDependency[_]] = Set.empty
  ) {
    def +(clientDep: ToClientDependency[_, _]): ReplicationCore =
      this.copy(toClientDeps = toClientDeps + clientDep)
    def +(serverDep: ToServerDependency[_]): ReplicationCore =
      this.copy(toServerDeps = toServerDeps + serverDep)
    def +(others: ReplicationCore*): ReplicationCore = {
      def fold[T](v: ReplicationCore => Set[T]) =
        others.foldLeft(v(this))(_ ++ v(_))

      val toClientDeps = fold(_.toClientDeps)
      val toServerDeps = fold(_.toServerDeps)

      ReplicationCore(toClientDeps, toServerDeps)
    }

    /**
     * @returns an initial message carrier from which the client specific
     * to-be-transfered state can be pulled
     */
    lazy val initialCarrier: Behavior[Client => Seq[Message]] = {
      val carriers = toClientDeps.map(_.stateData.map(_.carrier)).flatten
      val seqCarrier = carriers.foldLeft(Behavior.constant(collection.Seq.empty[Client => Message])) { (acc, n) =>
        val fa = n.map { newVal => seq: Seq[Client => Message] =>
          seq :+ newVal
        }
        acc.reverseApply(fa)
      }
      seqCarrier.map { seq => c: Client =>
        seq.map(_(c))
      }
    }

    /**
     * @returns a message carrier that pushes client specific
     * to-be-transfered state
     */
    lazy val serverCarrier: HEvent[Client => Seq[Message]] =
      HEvent.merge(toClientDeps.map(_.updateData.carrier).toSeq).map { seq => c: Client =>
        seq.map(_(c)).flatten
      }

    /**
     * @returns a message carrier that pushes to-be-transfered state
     */
    lazy val clientCarrier: Rep[ScalaJs[HEvent[ScalaJs[Seq[Message]]]]] = {
      val carriers = toServerDeps.map(_.messageCarrier).toSeq
      val lst = ScalaJsRuntime.encodeListAsSeq(List(carriers: _*))
      EventRep.merge(lst)
    }

    def namedPulseMaker(select: ToClientDependency[_, _] => Option[Rep[String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]]): Rep[NamedClientPulseMaker] = {
      val map = JSMap[String, String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]()
      val namedToClientDeps = toClientDeps.foreach { d =>
        select(d).foreach { mkPulse =>
          map.update(unit(d.name), mkPulse)
        }
      }
      map
    }

    /**
     * named pulse makers to inject updates in the FRP network
     */
    lazy val clientNamedUpdatePulseMakers: Rep[NamedClientPulseMaker] =
      namedPulseMaker(x => Some(x.updateData.mkPulse))

    /**
     * named pulse makers to inject resets in the FRP network
     */
    lazy val clientNamedResetPulseMakers: Rep[NamedClientPulseMaker] =
      namedPulseMaker(_.stateData.map(_.mkPulse))

    /**
     * named pulse makers to inject data in the FRP network
     */
    lazy val serverNamedPulseMakers: NamedServerPulseMaker =
      toServerDeps.map { d =>
        (d.name, d.pulse _)
      }.toMap

  }

}
