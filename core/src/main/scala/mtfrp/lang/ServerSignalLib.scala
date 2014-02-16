package mtfrp.lang

import scala.js.language.JS
import reactive.{ Observing, Signal }
import spray.routing.Route
import spray.json.JsonWriter

trait ServerSignalLib extends JS with ServerEventLib {
  self: ClientSignalLib =>

  object ServerSignal {
    def apply[T](init: T, stepper: ServerEvent[T]) =
      new ServerSignal(stepper.route, stepper.stream hold init, stepper.observing)
  }

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerSignal[T]) {
    def toClient: ClientSignal[T] = ClientSignal(evt)
  }

  class ServerSignal[T] private (
      val route: Option[Route],
      val signal: Signal[T],
      val observing: Option[Observing]) {

    def copy[A](
      route: Option[Route] = this.route,
      signal: Signal[A] = this.signal,
      observing: Option[Observing] = this.observing): ServerSignal[A] =
      new ServerSignal(route, signal, observing)

    def map[A](modifier: T => A): ServerSignal[A] =
      this.copy(signal = this.signal map modifier)

    private[mtfrp] def changes: ServerEvent[T] =
      ServerEvent(route, signal.change, observing)

    def fold[A](start: A)(stepper: (A, T) => A): ServerSignal[A] =
      this.copy(signal = this.signal.foldLeft(start)(stepper))
  }
}