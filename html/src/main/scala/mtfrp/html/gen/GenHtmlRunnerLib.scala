package mtfrp.html.gen

import mtfrp.gen.GenMtFrp
import mtfrp.html.lang.HtmlRunnerLib
import scala.js.gen.js.dom.GenBrowser

object GenHtmlRunnerLib {
  def apply(ir: HtmlRunnerLib) =
    new GenHtmlRunnerLib { val IR: ir.type = ir }
}

trait GenHtmlRunnerLib
  extends GenMtFrp
  with GenHtmlNodeBuilderLib
  with GenBrowser {
  val IR: HtmlRunnerLib
}
