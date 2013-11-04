package mtfrp.server

import java.net.URLEncoder
import java.util.UUID

import scala.annotation.implicitNotFound
import scala.js.exp.{FFIExp, JSExp}

import mtfrp.client.{ClientEventStreamLib, JSJsonReaderContext}
import mtfrp.client.frp.BaconLib
import reactive.{EventSource, EventStream}
import spray.json.{JsonReader, JsonWriter, pimpString}
import spray.routing.{Directives, Route}
import spray.routing.Directive.pimpApply
import spray.routing.directives.CompletionMagnet.fromObject

trait ServerEventStreamLib {
  self: JSJsonWriterContext with JSJsonReaderContext with ClientEventStreamLib with JSExp with FFIExp with BaconLib with ServerSignalLib =>

  private def ajaxPost(url: Rep[String], value: Rep[String]): Rep[Unit] =
    foreign"$$.post($url, $value)".withEffect()

  private[mtfrp] object ServerEventStream extends Directives {
    def fromClientEventStream[T: JsonReader: JSJsonWriter: Manifest](stream: ClientEventStream[T]): ServerEventStream[T] = {
      val genUrl = URLEncoder encode UUID.randomUUID.toString
      val source = new EventSource[T]

      val initRoute = path(genUrl) {
        post {
          entity(as[String]) { data =>
            complete {
              source fire data.asJson.convertTo[T]
              "OK"
            }
          }
        }
      }

      val initExp = makeInitExp(stream, genUrl)

      val newRoute = stream.initRoute match {
        case Some(route) => initRoute ~ route
        case None        => initRoute
      }

      new ServerEventStream(Some(newRoute), source)
    }
  }

  // fix for serialization --- needed for recursion check??
  private def makeInitExp[T: JSJsonWriter: Manifest](stream: ClientEventStream[T], genUrl: String) =
    stream.exp onValue fun { value =>
      ajaxPost(genUrl, implicitly[JSJsonWriter[T]] write value)
    }

  implicit class ReactiveToServer[T: JsonReader: JSJsonWriter: Manifest](stream: ClientEventStream[T]) {
    def toServer: ServerEventStream[T] =
      ServerEventStream fromClientEventStream stream
  }

  implicit class ReactiveToClient[T: JsonWriter: JSJsonReader: Manifest](ses: ServerEventStream[T]) {
    def toClient: ClientEventStream[T] =
      ClientEventStream fromStream (ses.stream, ses.initRoute)
  }

  class ServerEventStream[T] private (
      val initRoute: Option[Route],
      val stream: EventStream[T]) {

    private def innerMap[A](streamF: EventStream[T] => EventStream[A]) =
      new ServerEventStream(initRoute, streamF(stream))

    def map[A](modifier: T => A): ServerEventStream[A] =
      innerMap(_ map modifier)

    def fold[A](start: A)(stepper: (A, T) => A): ServerEventStream[A] =
      innerMap(_.foldLeft(start)(stepper))

    def filter(pred: T => Boolean): ServerEventStream[T] =
      innerMap(_ filter pred)

    def hold(initial: T): ServerSignal[T] =
      new ServerSignal(initRoute, stream hold initial)
  }
}