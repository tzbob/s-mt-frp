package mtfrp.exp

import hokko.core.Engine
import mtfrp.lang.{ Client, DelayedEval }
import scala.virtualization.lms.common.BaseExp

import io.circe._
import io.circe.generic.auto._
import io.circe.parser._
import io.circe.syntax._

trait DelayedEvalExp extends DelayedEval with JSJsonFormatLibExp {
  case class DelayedForClient(thunk: (Client, Engine) => Exp[String]) extends Def[String]

  def delay[T: Manifest: Encoder](thunk: (Client, Engine) => T): Exp[String] =
    DelayedForClient { (client, engine) =>
      val data = thunk(client, engine)
      val serverJson = data.asJson.noSpaces
      unit(serverJson)
    }
}
