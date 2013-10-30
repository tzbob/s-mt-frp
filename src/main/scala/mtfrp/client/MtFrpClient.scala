package mtfrp.client

import scala.js.exp.CastsCheckedExp
import scala.js.exp.JSExp
import scala.js.exp.RecordsExp
import scala.js.exp.dom.BrowserExp
import scala.js.language.Casts
import scala.virtualization.lms.common.FunctionsExp
import scala.virtualization.lms.common.StructExp

import akka.actor.actorRef2Scala
import forest.ForestExp
import reactive.EventStream
import reactive.Observing
import spray.http.HttpEntity.apply
import spray.json._
import spray.json.JsonWriter
import spray.routing.Directive.pimpApply

trait MtFrpClient
    extends BaconLibExp
    with FunctionsExp
    with BrowserExp
    with JSExp
    with Casts
    with ForestExp
    with JSJsonReaderContext
    with ClientEventStreamLib
    with ClientSignalLib {
  import spray.json.DefaultJsonProtocol._

  def main: ClientSignal[Element]

  implicit class ElementOpsInnerHTML(e: Exp[Element]) {
    def setInnerHTML(value: Rep[String]): Rep[Unit] =
      foreign"$e.innerHTML = $value".withEffect()

    def toStream(ev: EventDef)(implicit m: Manifest[ev.Type]): ClientEventStream[ev.Type] = {
      val bus = bacon.Bus[ev.Type]
      e.on(ev)(bus push _)
      ClientEventStream(bus)
    }
  }

}