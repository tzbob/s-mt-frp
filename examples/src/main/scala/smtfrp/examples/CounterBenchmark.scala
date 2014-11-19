package smtfrp.examples

import mtfrp.lang._

trait CounterBenchmark extends MtFrpProg {
  var x: Long = _
  val clients = 2
  val sends = 100

  var old: Long = System.currentTimeMillis()
  var old10000: Long = System.currentTimeMillis()

  lazy val (sendT, sendE) = button(Click)
  lazy val serverE = sendE.map(_ => 1).toServerAnon
  lazy val chat = serverE.fold(0) { (acc, n) =>
    val nacc = acc + n
    val did100: Boolean = nacc % 100 == 0
    val did10000: Boolean = nacc % 10000 == 0

    if (did10000) {
      val now = System.currentTimeMillis()
      val diff = now - old10000
      System.out.println(s"100000 requests processed within $diff ms, avg: ${10000.0 / diff * 1000} req/ms")
      old10000 = now
    }

    if (did100) {
      val now = System.currentTimeMillis()
      val diff = now - old
      System.out.println(s"100 requests processed within $diff ms, avg: ${100.0 / diff * 1000} req/ms")
      old = now
    }
    nacc
  }

  def main: ClientBehavior[HtmlNode] = chat.toAllClients.map { c =>
    div(
      sendT("id" := "btn")("Submit"),
      span("id" := "label")(c + ""))
  }
}
