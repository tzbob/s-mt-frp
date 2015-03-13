package mtfrp.exp

import hokko.core.Engine
import mtfrp.lang.{ Client, DelayedEval }
import scala.virtualization.lms.common.BaseExp
import spray.json._

trait DelayedEvalExp extends DelayedEval with JSJsonFormatLibExp {
  case class DelayedForClient[T](thunk: (Client, Engine) => Exp[T]) extends Def[T]

  def delay[T: Manifest: JsonWriter: JSJsonReader](thunk: (Client, Engine) => T): Exp[T] =
    DelayedForClient { (client, engine) =>
      val data = thunk(client, engine)
      val serverJson = data.toJson.compactPrint
      val clientJson = unit(serverJson)
      clientJson.convertToRep[T]
    }
}
