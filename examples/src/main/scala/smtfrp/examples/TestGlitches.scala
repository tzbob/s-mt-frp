package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol

trait TestGlitches extends MtFrpProg with EasyHTML {
  import DefaultJsonProtocol._

  lazy val btn = button("Fire")
  lazy val a = btn.toStream(Click).fold(0) { (acc, _) => acc + 20 }.changes
  lazy val a2a = a.map(_ * 2)
  lazy val a2b = a.map(_ * 2)

  lazy val sa2a = a2a.toServerAnon.hold(10)
  lazy val sa2b = a2b.toServerAnon.hold(10)

  lazy val alwaysTrue = sa2a.combine(sa2b)(_.equals(_))

  def main: ClientBehavior[Element] = {
    alwaysTrue.behavior.changes.foreach(System.out.println)
    alwaysTrue.toAllClients.map { t =>
      el('div)(
        el('h1)("Glitch test"),
        el('div)(t + ""),
        el('div)(btn))
    }
  }

}