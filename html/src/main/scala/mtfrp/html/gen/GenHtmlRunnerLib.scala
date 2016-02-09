package mtfrp.html.gen

import mtfrp.gen.GenMtFrp
import mtfrp.html.lang.HtmlRunnerLib

object GenHtmlRunnerLib {
  def apply(ir: HtmlRunnerLib) =
    new GenHtmlRunnerLib { val IR: ir.type = ir }
}

trait GenHtmlRunnerLib extends GenMtFrp {
  val IR: HtmlRunnerLib
}
