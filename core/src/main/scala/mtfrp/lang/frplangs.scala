package mtfrp.lang

import scala.js.language.Adts
import scala.js.language.dom.Browser
import forest.Forest
import spray.json.DefaultJsonProtocol

trait FrpLib
  extends ClientEventLib
  with ServerEventLib
  with ClientBehaviorLib
  with ServerBehaviorLib

trait MtFrpProg
  extends FrpExtensions
  with JSJsonFormatLib
  with Forest
  with Browser
  with Adts
  with DocumentOpsExtended {

  def main: ClientBehavior[Element]

  private[mtfrp] def mainGen: ClientBehavior[Element] = {
    val resetBody: Rep[Element => Unit] = fun { el =>
      // clean body
      document.body.setInnerHTML("")
      // fill body
      document.body.appendChild(el)
    }

    val signal = main
    resetBody(signal.rep.markExit(globalContext).now())
    signal.rep.changes.foreach(fun { resetBody(_) }, globalContext)
    signal
  }
}
