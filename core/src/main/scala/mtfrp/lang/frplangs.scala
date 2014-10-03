package mtfrp.lang

import scala.js.language.Adts
import scala.js.language.dom.Browser
import forest.Forest
import spray.json.DefaultJsonProtocol
import spray.routing.Route
import scala.slick.driver.JdbcProfile
import scala.slick.driver.JdbcDriver

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
    extends MtFrpLib
    with FrpExtensions
    with Forest
    with Browser
    with Adts
    with DocumentOpsExtended
    with DefaultJsonProtocol {
  def main: ClientBehavior[Element]

  private[mtfrp] def addHTMLUpdates: ClientBehavior[Element] = {
    val resetBody: Rep[Element => Unit] = fun { el =>
      // clean body
      document.body.setInnerHTML("")
      // fill body
      document.body.appendChild(el)
    }

    val behavior = main
    resetBody(behavior.rep.markExit(FRP.global).now())
    behavior.rep.changes.foreach(fun { resetBody(_) }, FRP.global)
    behavior
  }

  private[mtfrp] def mainGen: (Rep[JSBehavior[Element]], Option[Route]) = {
    val behavior = addHTMLUpdates
    (behavior.rep, behavior.core.route)
  }
}

trait NoDB {
  type Profile = JdbcDriver
  val driver = JdbcDriver
}