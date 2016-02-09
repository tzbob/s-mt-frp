package mtfrp.lang

import scala.js.language._
import spray.json.DefaultJsonProtocol

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg[Main]
  extends MtFrpLib
  with Adts
  with DefaultJsonProtocol
  with JS {
  def main(): ClientDiscreteBehavior[Main]
}
