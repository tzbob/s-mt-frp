package mtfrp.client

import scala.js.exp.JSExp
import scala.js.exp.dom.BrowserExp
import scala.js.language.Casts

import forest.ForestExp
import mtfrp.client.frp.BaconLibExp

trait MtFrpClient
    extends BaconLibExp
    with BrowserExp
    with JSExp
    with Casts
    with ForestExp
    with JSJsonReaderContext
    with ClientEventStreamLib
    with ClientSignalLib
    with ElemFRPLib {
  def main: ClientSignal[Element]
}