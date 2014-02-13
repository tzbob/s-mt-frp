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
}
