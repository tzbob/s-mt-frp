package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol

trait MultipleDeps extends MtFrpProg with EasyHTML {
  import DefaultJsonProtocol._

  lazy val btn = button("Start")
  lazy val a: ServerEvent[String] = btn.toStream(Click).map(_ => "a's").toServerAnon
  lazy val b: ClientEvent[String] = a.toAllClients
  lazy val c: ClientEvent[String] = b.map(_ => "c's")
  lazy val d: ClientEvent[String] = b.map(_ => "d's")
  lazy val e: ClientEvent[String] = c.merge(d)

  def main: ClientBehavior[Element] = e.hold("start").map { evt =>
    el('div)(
      el('h1)("Deps prog"),
      el('div)(evt),
      el('div)(btn)
    )
  }

}