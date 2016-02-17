package mtfrp.lang

import scala.virtualization.lms.common.Base


trait MiniXhrLib extends Base {

  trait XhrPromise

  def Xhr: MiniXhr

  trait MiniXhr {
    def post(url: Rep[String], data: Rep[String]): Rep[XhrPromise]
    def chain(xhr1: Rep[XhrPromise], xhr2: Rep[String => XhrPromise]): Rep[XhrPromise]
  }

}
