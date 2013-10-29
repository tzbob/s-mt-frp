package mtfrp.server

import java.net.URLEncoder
import java.util.UUID

import mtfrp.client.MtFrpClient
import reactive.EventSource
import reactive.EventStream
import spray.json.JsonReader
import spray.json.JsonWriter
import spray.json.pimpString
import spray.routing.Directive.pimpApply
import spray.routing.Directives
import spray.routing.Route
import spray.routing.directives.CompletionMagnet.fromObject

trait MtFrpServer
    extends MtFrpClient
    with JSJsonWriterContext {
  import spray.json._
  import DefaultJsonProtocol._

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

      new ServerEventStream(initRoute ~ stream.initRoute, initExp, source)
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
      ClientEventStream fromStream (ses.stream, Some(ses.initRoute))
  }

  class ServerEventStream[T] private (
      val initRoute: Route,
      val initExp: Exp[Unit],
      val stream: EventStream[T]) {

    def map[A](modifier: T => A): ServerEventStream[A] =
      new ServerEventStream(initRoute, initExp, stream.map(modifier))

  }

}