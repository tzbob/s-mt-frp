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
      new ServerBehavior(stepper.route, stepper.stream hold init, stepper.observing)
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
      val route: Option[Route],
      val signal: Signal[T],
      val observing: Option[Observing]) {

    private[this] def copy[A](
      route: Option[Route] = this.route,
      signal: Signal[A] = this.signal,
      observing: Option[Observing] = this.observing): ServerBehavior[A] =
      new ServerBehavior(route, signal, observing)

    private[mtfrp] def changes: ServerEvent[T] =
      ServerEvent(route, signal.change, observing)

    def map[A](modifier: T => A): ServerBehavior[A] =
      this.copy(signal = this.signal map modifier)

    def sampledBy(event: ServerEvent[_]): ServerEvent[T] =
      ServerEvent(route, event.stream.map { _ => signal.now }, observing)

    def fold[A](start: A)(stepper: (A, T) => A): ServerBehavior[A] =
      this.copy(signal = this.signal.foldLeft(start)(stepper))

    def combine[A, B](that: ServerBehavior[A])(f: (T, A) => B): ServerBehavior[B] = {
      val signal = this.signal.flatMap { ts =>
        that.signal.map { as => f(ts, as) }
      }
      val route = combineRouteOpts(this.route, that.route)
      this.copy(route = route, signal = signal)
    }
  }
}
