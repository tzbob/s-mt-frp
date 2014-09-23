package mtfrp.lang

import scala.js.language.Adts
import scala.js.language.dom.Browser
import forest.Forest
import spray.json.DefaultJsonProtocol
import spray.routing.Route

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

  private[mtfrp] def mainGen: (Rep[JSBehavior[Element]], Option[Route]) = {
    val resetBody: Rep[Element => Unit] = fun { el =>
      // clean body
      document.body.setInnerHTML("")
      // fill body
      document.body.appendChild(el)
    }

    val signal = main
    resetBody(signal.rep.markExit(globalContext).now())
    signal.rep.changes.foreach(fun { resetBody(_) }, globalContext)
    (signal.rep, signal.core.route)
  }
}
