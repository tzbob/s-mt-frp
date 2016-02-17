package mtfrp.exp

import mtfrp.lang.MiniXhrLib
import scala.js.exp.FFIExp

trait MiniXhrLibExp extends MiniXhrLib with FFIExp {

  val Xhr: MiniXhr = MiniXhrImpl

  private object MiniXhrImpl extends MiniXhr {
    def post(url: Rep[String], data: Rep[String]): Rep[XhrPromise] =
      foreign"Q.xhr.post($url, $data)".withEffect()

    def chain(xhr1: Rep[XhrPromise], xhr2: Rep[String => XhrPromise]): Rep[XhrPromise] =
      foreign"$xhr1.then($xhr2)".withEffect()
  }
}
