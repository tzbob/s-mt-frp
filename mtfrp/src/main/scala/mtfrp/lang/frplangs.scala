package mtfrp.lang

import scala.js.language._
import scala.js.language.dom.Browser
import spray.json.DefaultJsonProtocol

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
  extends MtFrpLib
  with Adts
  with DefaultJsonProtocol
  with JS

