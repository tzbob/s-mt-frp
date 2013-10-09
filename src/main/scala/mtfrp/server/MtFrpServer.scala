package mtfrp.server

import java.net.URLEncoder
import java.util.UUID

import scala.js.exp.AjaxExp
import scala.js.exp.CPSExp

import mtfrp.client.MtFrpClient
import reactive.EventSource
import reactive.EventStream
import spray.routing.Directive.pimpApply
import spray.routing.Directives
import spray.routing.Route
import spray.routing.directives.CompletionMagnet.fromObject

trait MtFrpServer extends MtFrpClient with AjaxExp with CPSExp {

  private[mtfrp] object ServerEventStream extends Directives {
    def fromClientEventStream(stream: ClientEventStream): ServerEventStream = {
      val genUrl = URLEncoder encode UUID.randomUUID.toString
      val source = new EventSource[String]

      val initRoute = path(genUrl) {
        post {
          entity(as[String]) { data =>
            complete {
              source fire data
              "OK"
            }
          }
        }
      }

      val initExp = makeInitExp(stream, genUrl)

      new ServerEventStream(initRoute ~ stream.initRoute, initExp, source)
    }
  }

  // fix for serialization --- needed for recursive function check??
  private def makeInitExp(stream: ClientEventStream, genUrl: String) =
    stream.exp onValue fun { value =>
      foreign"$$.post($genUrl, $value)".withEffect()
    }

  implicit class ReactiveToServer(stream: ClientEventStream) {
    def toServer: ServerEventStream = ServerEventStream fromClientEventStream stream
  }

  class ServerEventStream private (
      val initRoute: Route,
      val initExp: Exp[Unit],
      val stream: EventStream[String]) {

    def map(modifier: String => String): ServerEventStream =
      new ServerEventStream(initRoute, initExp, stream.map(modifier))

    def toClient: ClientEventStream = ClientEventStream fromStream (stream, Some(initRoute))
  }

}