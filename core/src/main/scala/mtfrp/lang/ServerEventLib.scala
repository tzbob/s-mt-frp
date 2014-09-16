package mtfrp.lang

import java.net.URLEncoder
import java.util.UUID
import scala.js.exp.JSExp
import spray.json.{ JsonReader, JsonWriter, pimpString }
import spray.routing.{ Directives, Route }
import frp.core.Event
import frp.core.EventSource
import frp.core.TickContext.globalTickContext
import frp.core.EventSource

trait ServerEventLib extends JSJsonWriterLib
    with ReplicationCoreLib with JSExp with XMLHttpRequests with DelayedEval {
  self: ClientEventLib with ServerBehaviorLib =>

  private[mtfrp] object ServerEvent extends Directives {
    def apply[T](stream: frp.core.Event[T]): ServerEvent[T] =
      new ServerEvent(stream, ReplicationCore())

    def apply[T](
      stream: frp.core.Event[T],
      core: ReplicationCore): ServerEvent[T] =
      new ServerEvent(stream, core)

    def apply[T: JsonReader: JSJsonWriter: Manifest](event: ClientEvent[T]): ServerEvent[(Client, T)] = {
      val source = frp.core.EventSource.concerning[(Client, T)]
      val toServerDep = new ToServerDependency(event.rep, source)
      ServerEvent(source, event.core.addToServerDependencies(toServerDep))
    }
  }

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[Client => Option[T]]) {
    def toClient: ClientEvent[T] = {
      ClientEvent(evt)
    }
  }
  implicit class ReactiveToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[T]) {
    def toAllClients: ClientEvent[T] = ClientEvent(evt.map { t =>
      c: Client => Some(t)
    })
  }

  class ServerEvent[+T] private (
      val stream: frp.core.Event[T],
      val core: ReplicationCore) {

    private[this] def copy[A](
      stream: frp.core.Event[A] = this.stream,
      core: ReplicationCore = this.core): ServerEvent[A] =
      new ServerEvent(stream, core)

    def map[A](modifier: T => A): ServerEvent[A] =
      this.copy(stream = this.stream map modifier)

    def or[A >: T](that: ServerEvent[A]): ServerEvent[A] =
      this.copy(core = core.combine(that.core), stream = stream or that.stream)

    def filter(pred: T => Boolean): ServerEvent[T] =
      this.copy(stream = this.stream filter pred)

    def hold[U >: T](initial: U): ServerBehavior[U] =
      ServerBehavior(stream.hold(initial), core)

    def fold[A](start: A)(stepper: (A, T) => A): ServerBehavior[A] = {
      val beh = this.stream.foldPast(start)(stepper)
      ServerBehavior(stream.foldPast(start)(stepper), core)
    }
  }
}
