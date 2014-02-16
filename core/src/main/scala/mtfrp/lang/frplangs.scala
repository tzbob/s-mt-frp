package mtfrp.lang

import scala.js.language.Adts
import scala.js.language.dom.Browser
import forest.Forest

trait FrpLib
  extends ClientEventLib
  with ServerEventLib
  with ClientSignalLib
  with ServerSignalLib

trait MtFrpProg
    extends FrpExtensions
    with JSJsonFormatLib
    with Forest
    with Browser
    with Adts
    with DocumentOpsExtended {
  def main: ClientSignal[Element]

  private[mtfrp] def mainGen: ClientSignal[Element] = {
    val signal = main
    signal.rep onValue fun { (str: Rep[Element]) =>
      // clean body
      document.body.setInnerHTML("")
      // fill body
      document.body.appendChild(str)
    }
    signal
  }
}
