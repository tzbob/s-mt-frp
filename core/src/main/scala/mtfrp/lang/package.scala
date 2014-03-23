package mtfrp

import spray.routing.Route
import spray.routing.Directives.pimpRouteWithConcatenation

package object lang {
  def combineRouteOpts(r1: Option[Route], r2: Option[Route]) =
    r1 match {
      case None    => r2
      case Some(r) => r2.map(r ~ _)
    }
}