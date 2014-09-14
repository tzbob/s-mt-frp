package mtfrp.lang

import java.net.URLEncoder
import java.util.UUID
import scala.js.exp.JSExp
import spray.json.{ JsonReader, JsonWriter, pimpString }
import spray.routing.{ Directives, Route }
import frp.core.Event
import frp.core.EventSource
import frp.core.TickContext.global

trait ServerEventLib extends JSJsonWriterLib
  with JSExp with XMLHttpRequests with DelayedEval {
  self: ClientEventLib with ServerBehaviorLib =>

  private[mtfrp] object ServerEvent extends Directives {

    def apply[T](stream: frp.core.Event[T]): ServerEvent[T] =
      new ServerEvent(stream, ServerCore())

    def apply[T](
      stream: frp.core.Event[T],
      core: ServerCore): ServerEvent[T] =
      new ServerEvent(stream, core)

    def apply[T: JsonReader: JSJsonWriter: Manifest](event: ClientEvent[T]): ServerEvent[(Client, T)] = {
      val genUrl = URLEncoder encode (UUID.randomUUID.toString, "UTF-8")
      val source = frp.core.EventSource.concerning[(Client, T)]

      val route = path(genUrl) {
        parameter('id) { id =>
          post {
            entity(as[String]) { data =>
              complete {
                source.fire((Client(id), data.parseJson.convertTo[T]))
                "OK"
              }
            }
          }
        }
      }
      makeInitExp(event, genUrl)
      ServerEvent(source, event.core.combine(ServerCore(routes = Set(route))))
    }
  }

  // separate function to bypass serialization --- needed for recursion check??
  private def makeInitExp[T: JSJsonWriter: Manifest](stream: ClientEvent[T], genUrl: String) =
    stream.rep.foreach(fun { value =>
      val req = XMLHttpRequest()
      req.open("POST", includeClientIdParam(genUrl))
      req.send(value.toJSONString)
    }, globalContext)

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[Client => Option[T]]) {
    def toClient: ClientEvent[T] = ClientEvent(evt)
  }
  implicit class ReactiveToAllClients[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[T]) {
    def toAllClients: ClientEvent[T] = ClientEvent(evt.map { t =>
      c: Client => Some(t)
    })
  }

  class ServerEvent[+T] private (
    val stream: frp.core.Event[T],
    val core: ServerCore) {

    private[this] def copy[A](
      stream: frp.core.Event[A] = this.stream,
      core: ServerCore = this.core): ServerEvent[A] =
      new ServerEvent(stream, core)

    def map[A](modifier: T => A): ServerEvent[A] =
      this.copy(stream = this.stream map modifier)

    def merge[A >: T](that: ServerEvent[A]): ServerEvent[A] =
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
