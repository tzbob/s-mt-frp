package mtfrp.lang

import spray.routing.Route
import spray.routing.Directives._

object ServerCore {
  def apply(routes: Set[Route] = Set.empty) =
    new ServerCore(routes)
}

class ServerCore(val routes: Set[Route]) {
  def combine(that: ServerCore): ServerCore =
    ServerCore(routes ++ that.routes)
  def route: Option[Route] = routes.reduceOption { _ ~ _ }
}