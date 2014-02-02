package mtfrp.exp

import scala.js.exp.JSLiteralExp
import scala.js.exp.ProxyExp
import mtfrp.lang.XMLHttpRequests

trait XMLHttpRequestsExp extends XMLHttpRequests with JSLiteralExp with ProxyExp {
  case class NewXMLHttpRequest() extends Def[XMLHttpRequest]
  protected def newXMLHttpRequest() = NewXMLHttpRequest()
}