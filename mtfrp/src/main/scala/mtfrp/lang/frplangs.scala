package mtfrp.lang

import scala.js.language._

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
  extends MtFrpLib
  with Adts
  with JS {
  type Main
  def main(): ClientDiscreteBehavior[Main]
}
