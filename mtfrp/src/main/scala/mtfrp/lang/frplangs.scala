package mtfrp.lang

import scala.js.language._
import spray.json.DefaultJsonProtocol

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
  extends MtFrpLib
  with Adts
  with DefaultJsonProtocol
  with JS {
  type Main
  def main(): ClientDiscreteBehavior[Main]
}
