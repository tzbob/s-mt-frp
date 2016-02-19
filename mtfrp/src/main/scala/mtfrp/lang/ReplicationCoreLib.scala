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
  with Behavior.BehaviorLib with Behavior.BehaviorStaticLib
  with Engine.EngineLib with Engine.EngineStaticLib
  with Engine.Pulses.PulsesLib with Engine.Values.ValuesLib
  with MiniXhrLib with DelayedEval
  with JSMaps with ListOps with ListOps2 with TupleOps with OptionOps with StringOps {

  def encodeURIComponent(str: Rep[String]): Rep[String]

  trait ClientStatus { val client: Client }
  case class Connected(client: Client) extends ClientStatus
  case class Disconnected(client: Client) extends ClientStatus

  private[mtfrp] val rawClientEventSource = HEvent.source[ClientStatus]

  private[mtfrp] val rawClientStatus =
    rawClientEventSource.fold(Map.empty[Client, ClientStatus]) { (map, action) =>
      map.updated(action.client, action)
    }

  case class Message(name: String, json: String) extends Adt
  val MessageRep = adt[Message]
  private def tToMessage[F: Encoder](name: String)(t: F) = Message(name, t.asJson.noSpaces)
  private def tToRepMessage[F: JSJsonWriter](name: String)(t: Rep[F]) = MessageRep(unit(name), t.toJSONString)

  abstract class ToClientDependency[U: Encoder: JSJsonReader: Manifest](
    exit: HEvent[Client => Option[U]]
  ) {
    val name = UUID.randomUUID.toString
    val updateCarrier: HEvent[Client => Option[Message]] = exit.map { fun => (c: Client) =>
      fun(c).map(tToMessage[U](name))
    }

    val updateData: ClientReplicationData[U] = new ClientReplicationData
  }

  case class EventToClientDependency[U: Encoder: JSJsonReader: Manifest](
    exit: HEvent[Client => Option[U]]
  ) extends ToClientDependency[U](exit)

  case class BehaviorToClientDependency[U: Encoder: JSJsonReader: Manifest, Init: Encoder: JSJsonReader: Manifest](
    behavior: Behavior[Client => Init],
    exit: HEvent[Client => U]
  ) extends ToClientDependency[U](exit.map(_ andThen Some.apply)) {
    val stateCarrier: Behavior[Client => Message] = behavior.map { fun => c: Client =>
      tToMessage(name)(fun(c))
    }

    val stateData: ClientReplicationData[Init] = new ClientReplicationData
  }

  class ClientReplicationData[A: JSJsonReader: Manifest] {
    val source: Rep[ScalaJs[HEventSource[A]]] = EventRep.source[A]

    val mkPulse: Rep[String => ScalaJs[(ScalaJs[HEventSource[A]], A)]] =
      fun { jsonPulse =>
        ScalaJsRuntime.encodeTup2(make_tuple2(source -> jsonPulse.convertToRep[A]))
      }
  }

  abstract class ToServerDependency[T: Decoder: JSJsonWriter: Manifest](
    exit: Rep[ScalaJs[HEvent[T]]]
  ) {
    val name = UUID.randomUUID.toString

    val updateCarrier: Rep[ScalaJs[HEvent[Message]]] =
      exit.map(ScalaJsRuntime.encodeFn1(fun { (t: Rep[T]) =>
        MessageRep(unit(name), t.toJSONString)
      }))
    val updateData: ServerReplicationData[T] = new ServerReplicationData
  }

  case class EventToServerDependency[T: Decoder: JSJsonWriter: Manifest](
    exit: Rep[ScalaJs[HEvent[T]]]
  ) extends ToServerDependency[T](exit)

  case class BehaviorToServerDependency[U: Decoder: JSJsonWriter: Manifest, Init: Decoder: JSJsonWriter: Manifest](
    exit: Rep[ScalaJs[HEvent[U]]],
    behavior: Rep[ScalaJs[Behavior[Init]]]
  ) extends ToServerDependency[U](exit) {
    val initialsData: ServerReplicationData[Init] = new ServerReplicationData

    val initialsCarrier: Rep[ScalaJs[Behavior[Message]]] =
      behavior.map(ScalaJsRuntime.encodeFn1 { v: Rep[Init] =>
        tToRepMessage(name)(v)
      })
  }

  class ServerReplicationData[A: Decoder] {
    val source = hokko.core.Event.source[(Client, A)]

    def pulse(jsonPulse: String, client: Client): (hokko.core.EventSource[(Client, A)], (Client, A)) = {
      // TODO: Make this safe? Log the errors and ignore wrong formats?
      val newPulse = client -> decode[A](jsonPulse).toOption.get
      (source, newPulse)
    }
  }

  object ReplicationCore {
    def empty = ReplicationCore()
    def merge(seq: Seq[ReplicationCore]) =
      seq.foldLeft(ReplicationCore.empty) { (acc, n) =>
        acc.+(n)
      }
  }

  type NamedServerPulseMaker = Map[String, (String, Client) => (HEventSource[(Client, T)], (Client, T)) forSome { type T }]
  type NamedClientPulseMaker = Map[String, String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]

  case class ReplicationCore(
    toClientDeps: Set[ToClientDependency[_]] = Set.empty,
    toServerDeps: Set[ToServerDependency[_]] = Set.empty
  ) {
    def +(clientDep: ToClientDependency[_]): ReplicationCore =
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
    lazy val serverInitialCarrier: Behavior[Client => Seq[Message]] = {
      val carriers = toClientDeps.collect {
        case b @ BehaviorToClientDependency(_, _) => b.stateCarrier
      }

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
    lazy val serverCarrier: HEvent[Client => Seq[Message]] = {
      HEvent.merge(toClientDeps.map(_.updateCarrier).toSeq).map { seq => c: Client =>
        seq.map(_(c)).flatten
      }
    }

    /**
     * @returns a message carrier that pushes to-be-transfered state
     */
    lazy val clientCarrier: Rep[ScalaJs[HEvent[ScalaJs[Seq[Message]]]]] = {
      System.out.println(s"serverdepppsss ${toServerDeps}")
      val carriers = toServerDeps.map{ x =>
        println(x)
        x.updateCarrier }.toSeq
      val lst = ScalaJsRuntime.encodeListAsSeq(List(carriers: _*))
      EventRep.merge(lst)
    }

    /**
      * @returns an initial message carrier from which the
      * to-be-transfered state can be pulled
      */
    lazy val clientInitialCarrier: Rep[ScalaJs[Behavior[List[Message]]]] = {
      val carriers = toServerDeps.collect {
        case b @ BehaviorToServerDependency(_, _) => b.initialsCarrier
      }

      val seqCarrier = carriers.foldLeft(BehaviorRep.constant(List[Message]())) { (acc, n) =>
        val fa = n.map( ScalaJsRuntime.encodeFn1(fun { newVal: Rep[Message] =>
                                                   ScalaJsRuntime.encodeFn1( fun {list: Rep[List[Message]] =>
          list ++ List[Message](newVal)
                                                                            })
                                                 }))
        acc.reverseApply(fa)
      }
      seqCarrier
    }

    def namedPulseMaker(select: ToClientDependency[_] => Option[Rep[String => ScalaJs[(ScalaJs[HEventSource[T]], T)] forSome { type T }]]): Rep[NamedClientPulseMaker] = {
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
      namedPulseMaker { x => Some(x.updateData.mkPulse) }

    /**
     * named pulse makers to inject resets in the FRP network
     */
    lazy val clientNamedResetPulseMakers: Rep[NamedClientPulseMaker] =
      namedPulseMaker {
        _ match {
          case b @ BehaviorToClientDependency(_, _) => Some(b.stateData.mkPulse)
          case _ => None
        }
      }

    /**
     * named pulse makers to inject data in the FRP network
     */
    lazy val serverNamedPulseMakers: NamedServerPulseMaker =
      toServerDeps.map { d =>
        (d.name, d.updateData.pulse _)
      }.toMap

    lazy val serverNamedInitialsPulseMakers: NamedServerPulseMaker =
      toServerDeps.collect {
        case b @ BehaviorToServerDependency(_, _) => b.name -> b.initialsData.pulse _
      }.toMap

  }

}
