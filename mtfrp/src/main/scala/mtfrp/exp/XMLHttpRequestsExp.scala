package mtfrp.exp

import mtfrp.lang.XMLHttpRequests
import scala.virtualization.lms.common._

trait XMLHttpRequestsExp extends XMLHttpRequests with BaseExp with EffectExp {
  case class NewXMLHttpRequest() extends Def[XMLHttpRequest]
  protected def newXMLHttpRequest() = reflectEffect(NewXMLHttpRequest())
}
