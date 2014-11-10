package smtfrp.examples

import mtfrp.lang._

trait CounterBenchmark extends MtFrpProg {
  var x: Long = _
  val clients = 2
  val sends = 100

  lazy val (sendT, sendE) = button(Click)
  lazy val serverE = sendE.map(_ => 1).toServerAnon
  lazy val chat = serverE.fold(0) { (acc, n) =>
    val nacc = acc + n
    if (nacc >= clients * sends) x = System.currentTimeMillis();
    nacc
  }

  def main: ClientBehavior[HtmlNode] = chat.toAllClients.map { c =>
    div(
      sendT("id" := "btn")("Submit"),
      span("id" := "label")(c + ""))
  }
}
