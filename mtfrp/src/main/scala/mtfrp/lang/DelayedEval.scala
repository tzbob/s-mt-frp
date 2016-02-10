package mtfrp.lang

import hokko.core.Engine
import scala.virtualization.lms.common.Base

import io.circe.Encoder

trait DelayedEval extends JSJsonFormatLib {
  def delay[T: Manifest: Encoder](thunk: (Client, Engine) => T): Rep[String]

  def includeClientIdParam(url: String): Rep[String] =
    delay((client, _) => (url + "?id=" + client.id)).convertToRep[String]
}
