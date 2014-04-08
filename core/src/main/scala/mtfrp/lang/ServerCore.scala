package mtfrp.lang

import spray.routing.Route
import reactive.Observing
import reactive.ObservingGroup
import spray.routing.Directives.pimpRouteWithConcatenation

object ServerCore {
  def apply(routes: Set[Route] = Set.empty, obs: Set[Observing] = Set.empty) =
    new ServerCore(routes, obs)
}

class ServerCore(val routes: Set[Route], val obs: Set[Observing]) {
  def combine(that: ServerCore): ServerCore =
    ServerCore(routes ++ that.routes, obs ++ that.obs)

  def route: Option[Route] = routes.reduceOption { _ ~ _ }

  def observing: Option[Observing] = obs.toList match {
    case Nil => None
    case list => Some(new ObservingGroup {
      def observings: List[Observing] = list
    })
  }
}