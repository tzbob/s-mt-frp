package mtfrp.lang

import scala.js.language.JS
import spray.routing.Route
import spray.json.JsonWriter
import spray.json.JsonReader
import frp.core.Behavior

trait ServerBehaviorLib extends JS with ServerEventLib {
  self: ClientBehaviorLib =>

  object ServerBehavior {
    def apply[T](beh: Behavior[T], core: ServerCore) =
      new ServerBehavior(beh, core)
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
    val behavior: Behavior[T],
    val core: ServerCore) {

    private[this] def copy[A](
      behavior: Behavior[A] = this.behavior,
      core: ServerCore = this.core): ServerBehavior[A] =
      new ServerBehavior(behavior, core)

    private[mtfrp] def changes: ServerEvent[T] =
      ServerEvent(behavior.changes, core)

    def map[A](modifier: T => A): ServerBehavior[A] =
      this.copy(behavior = this.behavior map modifier)

    def sampledBy(event: ServerEvent[_]): ServerEvent[T] = {
      val core = this.core.combine(event.core)
      ServerEvent(behavior.sampledBy(event.stream), core)
    }

    def combine[A, B](that: ServerBehavior[A])(f: (T, A) => B): ServerBehavior[B] = {
      val behavior = this.behavior.combine(that.behavior, f)
      this.copy(behavior = behavior, core = core.combine(that.core))
    }
  }
}
