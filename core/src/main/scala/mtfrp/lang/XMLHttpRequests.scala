package mtfrp.lang

import scala.js.language.{JSLiteral, Proxy}

trait XMLHttpRequests extends JSLiteral with Proxy {

  object XMLHttpRequest {
    def apply() = newXMLHttpRequest()
  }
  protected def newXMLHttpRequest(): Rep[XMLHttpRequest]

  trait XMLHttpRequest {
    def send(data: Rep[String]): Rep[Unit]
    def open(method: Rep[String],
      url: Rep[String],
      async: Rep[Boolean] = unit(true)): Rep[Unit]
    var onreadystatechange: Rep[Unit => Unit]
  }
  implicit def repToRequest(x: Rep[XMLHttpRequest]): XMLHttpRequest =
    repProxy[XMLHttpRequest](x)

}