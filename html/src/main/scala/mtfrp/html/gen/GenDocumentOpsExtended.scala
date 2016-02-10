package mtfrp.html.gen

import mtfrp.gen.GenClientFRPLib
import scala.js.gen.js.GenFFI
import scala.js.gen.js.dom.GenBrowser
import mtfrp.html.exp.DocumentOpsExtendedExp

trait GenDocumentOpsExtended
  extends GenBrowser
  with GenFFI
  with GenClientFRPLib {

  val IR: DocumentOpsExtendedExp
}
