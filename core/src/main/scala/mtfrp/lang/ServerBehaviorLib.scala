package mtfrp.lang

import scala.js.language.JS
import reactive.{ Observing, Signal }
import spray.routing.Route
import spray.json.JsonWriter
import spray.json.JsonReader

trait ServerBehaviorLib extends JS with ServerEventLib {
  self: ClientBehaviorLib =>

  object ServerBehavior {
    def apply[T](init: T, stepper: ServerEvent[T]) =
      new ServerBehavior(stepper.stream hold init, stepper.core)
  }

  implicit class ReactiveToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerBehavior[T]) {
    def toAllClients: ClientBehavior[T] = ClientBehavior(evt.map { t =>
      c: Client => t
    })
  }

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerBehavior[Client => T]) {
    def toClient: ClientBehavior[T] = ClientBehavior(evt)
  }

  class ServerBehavior[+T] private (
      val signal: Signal[T],
      val core: ServerCore) {

    private[this] def copy[A](
      signal: Signal[A] = this.signal,
      core: ServerCore = this.core): ServerBehavior[A] =
      new ServerBehavior(signal, core)

    private[mtfrp] def changes: ServerEvent[T] =
      ServerEvent(signal.change, core)

    def map[A](modifier: T => A): ServerBehavior[A] =
      this.copy(signal = this.signal map modifier)

    def sampledBy(event: ServerEvent[_]): ServerEvent[T] = {
      val core = this.core.combine(event.core)
      ServerEvent(event.stream.map { _ => signal.now }, core)
    }

    def fold[A](start: A)(stepper: (A, T) => A): ServerBehavior[A] =
      this.copy(signal = this.signal.foldLeft(start)(stepper))

    def combine[A, B](that: ServerBehavior[A])(f: (T, A) => B): ServerBehavior[B] = {
      val signal = this.signal.flatMap { ts =>
        that.signal.map { as => f(ts, as) }
      }
      this.copy(signal = signal, core = core.combine(that.core))
    }
  }
}
