package mtfrp.lang

import scala.js.language.dom.Browser
import mtfrp.gen.GenMtFrp
import mtfrp.gen.GenMtFrp

trait MtFrpProg
    extends ClientEventLib
    with ServerEventLib
    with ClientSignalLib
    with Browser {
  def main: ClientSignal[Element]
}