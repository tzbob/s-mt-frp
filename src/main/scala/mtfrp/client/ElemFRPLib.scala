package mtfrp.client

import scala.js.exp.dom.BrowserExp

import mtfrp.client.frp.BaconLib

trait ElemFRPLib { self: BrowserExp with ClientEventStreamLib with BaconLib =>
  implicit class ElementOpsInnerHTML(e: Exp[Element]) {
    def setInnerHTML(value: Rep[String]): Rep[Unit] =
      foreign"$e.innerHTML = $value".withEffect()

    def innerHTML: Rep[String] = foreign"$e.innerHTML".withEffect()

    def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEventStream[ev.Type] = {
      val bus = bacon.Bus[ev.Type]
      e.on(ev)(bus push _)
      ClientEventStream(bus)
    }
  }

}