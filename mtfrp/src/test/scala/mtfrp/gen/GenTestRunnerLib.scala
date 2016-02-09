package mtfrp.gen

import mtfrp.lang.TestRunnerLib

object GenTestRunnerLib {
  def apply[TestData: Manifest](ir: TestRunnerLib[TestData]) =
    new GenTestRunnerLib { val IR: ir.type = ir }
}

abstract class GenTestRunnerLib[TestData: Manifest] extends GenMtFrp {
  val IR: TestRunnerLib[TestData]
}
