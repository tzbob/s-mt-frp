package mtfrp.lang

import hokko.core.Engine
import scala.virtualization.lms.common.Base
import spray.json._
import spray.json.DefaultJsonProtocol._

trait DelayedEval extends JSJsonFormatLib {
  def delay[T: Manifest: JsonWriter: JSJsonReader](thunk: (Client, Engine) => T): Rep[T]

  def includeClientIdParam(url: String): Rep[String] =
    delay((client, _) => url + "?id=" + client.id)
}
