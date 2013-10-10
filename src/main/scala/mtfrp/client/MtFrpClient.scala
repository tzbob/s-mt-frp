package mtfrp.client

import java.net.URLEncoder
import java.util.UUID

import scala.js.exp.JSExp
import scala.js.exp.dom.BrowserExp
import scala.virtualization.lms.common.FunctionsExp

import akka.actor.actorRef2Scala
import reactive.EventStream
import reactive.Observing
import spray.http.CacheDirectives
import spray.http.ChunkedResponseStart
import spray.http.HttpEntity.apply
import spray.http.HttpHeaders
import spray.http.HttpResponse
import spray.http.MediaType
import spray.http.MessageChunk
import spray.routing.Directive.pimpApply
import spray.routing.Directives
import spray.routing.RequestContext
import spray.routing.Route

trait MtFrpClient extends BaconLibExp with FunctionsExp with BrowserExp with JSExp {

  def main: ClientEventStream

  implicit class ElementOpsInnerHTML(e: Exp[Element]) {
    def setInnerHTML(value: Rep[String]): Rep[Unit] =
      foreign"$e.innerHTML = $value".withEffect()
  }

  private[mtfrp] object ClientEventStream extends Directives {
    // TODO find a better spot?
    implicit val observing = new Observing {}

    def fromStream(stream: EventStream[String], route: Option[Route] = None): ClientEventStream = {
      val genUrl = URLEncoder encode UUID.randomUUID.toString
      val bus = bacon.Bus[String]

      val initRoute = path(genUrl) {
        get {
          respondWithMediaType(MediaType.custom("text/event-stream")) {
            (ctx: RequestContext) =>
              ctx.responder ! ChunkedResponseStart(HttpResponse(
                headers = HttpHeaders.`Cache-Control`(CacheDirectives.`no-cache`) :: Nil,
                entity = ":" + (" " * 2049) + "\n" // 2k padding for IE polyfill (yaffle)
              ))
              stream foreach { data =>
                ctx.responder ! MessageChunk(s"data: $data\n\n")
              }
          }
        }
      }

      val initExp =
        foreign"""new EventSource($genUrl).onmessage = function(e) { 
          $bus.push(e.data) 
        }""".withEffect()

      val newRoute = route.map(_ ~ initRoute) getOrElse initRoute
      new ClientEventStream(newRoute, initExp, bus)
    }
  }

  class ClientEventStream private (
      val initRoute: Route,
      val initExp: Exp[Unit],
      val exp: Exp[BaconStream[String]]) {

    def map(modifier: Rep[String] => Rep[String]): ClientEventStream =
      new ClientEventStream(initRoute, initExp, exp.map(fun(modifier)))
  }

  implicit class ReactiveToClient(stream: EventStream[String]) {
    def toClient: ClientEventStream = ClientEventStream fromStream stream
  }

}