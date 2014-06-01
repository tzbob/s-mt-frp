package mtfrp.exp

import scala.js.exp.JSLiteralExp
import scala.js.exp.ProxyExp
import mtfrp.lang.XMLHttpRequests
import scala.js.exp.JSExp

trait XMLHttpRequestsExp extends XMLHttpRequests with JSExp {
  case class NewXMLHttpRequest() extends Def[XMLHttpRequest]
  protected def newXMLHttpRequest() = NewXMLHttpRequest()
}