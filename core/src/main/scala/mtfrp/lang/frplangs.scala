package mtfrp.lang

import scala.js.language.Adts
import scala.js.language.dom.Browser
import forest.Forest

trait FrpLib
  extends ClientEventLib
  with ServerEventLib
  with ClientSignalLib

trait MtFrpProg
    extends FrpExtensions
    with Forest
    with Browser
    with Adts
    with DocumentOpsExtended {
  def main: ClientSignal[Element]
}
