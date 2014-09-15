package mtfrp.lang

import spray.routing.Route
import spray.routing.Directives._

object ServerCore {
  def apply(routes: Set[Route] = Set.empty) =
    new ServerCore(routes)
}

class ServerCore(val routes: Set[Route]) {
  def combine(others: ServerCore*): ServerCore = {
    val routes = others.foldLeft(Set.empty[Route])(_ ++ _.routes)
    ServerCore(routes)
  }
  def route: Option[Route] = routes.reduceOption { _ ~ _ }
}