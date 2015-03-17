package mtfrp.exp

import hokko.core.Engine
import mtfrp.lang.{ Client, DelayedEval }
import scala.virtualization.lms.common.BaseExp
import spray.json._

trait DelayedEvalExp extends DelayedEval with JSJsonFormatLibExp {
  case class DelayedForClient(thunk: (Client, Engine) => Exp[String]) extends Def[String]

  def delay[T: Manifest: JsonWriter](thunk: (Client, Engine) => T): Exp[String] =
    DelayedForClient { (client, engine) =>
      val data = thunk(client, engine)
      val serverJson = data.toJson.compactPrint
      unit(serverJson)
    }
}
