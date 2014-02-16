package mtfrp.lang

import java.net.URLEncoder
import java.util.UUID
import scala.js.exp.JSExp
import reactive.{ EventStream, Observing }
import spray.json.{ JsonReader, JsonWriter, pimpString }
import spray.routing.{ Directives, Route }

trait ServerEventLib extends JSJsonWriterLib
    with JSExp with XMLHttpRequests {
  self: ClientEventLib with ServerSignalLib =>

  private[mtfrp] object ServerEvent extends Directives {

    def apply[T](stream: reactive.EventStream[T]): ServerEvent[T] =
      new ServerEvent(None, stream, None)

    def apply[T](
      route: Option[Route],
      stream: reactive.EventStream[T],
      observing: Option[Observing]): ServerEvent[T] =
      new ServerEvent(route, stream, observing)

    def apply[T: JsonReader: JSJsonWriter: Manifest](stream: ClientEvent[T]): ServerEvent[(Client, T)] = {
      val genUrl = URLEncoder encode (UUID.randomUUID.toString, "UTF-8")
      val source = new reactive.EventSource[(Client, T)]

      val initRoute = path(genUrl) {
        post {
          cookie("frpID") { idCookie =>
            entity(as[String]) { data =>
              complete {
                source fire (Client(idCookie.content), data.asJson.convertTo[T])
                "OK"
              }
            }
          }
        }
      }

      val initExp = makeInitExp(stream, genUrl)

      val newRoute = stream.route match {
        case Some(route) => initRoute ~ route
        case None        => initRoute
      }

      new ServerEvent(Some(newRoute), source, None)
    }
  }

  // fix for serialization --- needed for recursion check??
  private def makeInitExp[T: JSJsonWriter: Manifest](stream: ClientEvent[T], genUrl: String) =
    stream.rep onValue fun { value =>
      val req = XMLHttpRequest()
      req.open("POST", genUrl)
      req.send(value.toJSONString)
    }

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](evt: ServerEvent[(Client => Boolean, T)]) {
    def toClient: ClientEvent[T] = ClientEvent(evt)
  }

  class ServerEvent[T] private (
      val route: Option[Route],
      val stream: EventStream[T],
      val observing: Option[Observing]) {

    def copy[A](
      route: Option[Route] = this.route,
      stream: EventStream[A] = this.stream,
      observing: Option[Observing] = this.observing): ServerEvent[A] =
      new ServerEvent(route, stream, observing)

    def map[A](modifier: T => A): ServerEvent[A] =
      this.copy(stream = this.stream map modifier)

    def fold[A](start: A)(stepper: (A, T) => A): ServerEvent[A] =
      this.copy(stream = this.stream.foldLeft(start)(stepper))

    def filter(pred: T => Boolean): ServerEvent[T] =
      this.copy(stream = this.stream filter pred)

    def hold(initial: T): ServerSignal[T] = ServerSignal(initial, this)

    def fhold[A](start: A)(stepper: (A, T) => A): ServerSignal[A] =
      fold(start)(stepper) hold start
  }
}