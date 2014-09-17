package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol

trait TestGlitches extends MtFrpProg with EasyHTML {
  import DefaultJsonProtocol._

  lazy val btn = button("Test glitches")
  lazy val counter = btn.toStream(Click).fold(0) { (acc, _) => acc + 1 }.changes

  // create two streams from the same origin with identical values on the client
  lazy val a = counter.map(identity)
  lazy val b = counter.map(identity)

  // replicate two streams from the client to the server and turn them into behaviors
  lazy val aOnServer = a.toServerAnon.hold(0)
  lazy val bOnServer = b.toServerAnon.hold(0)

  // test server glitches, this value should always be true
  lazy val serverGlitch = aOnServer.combine(bOnServer)(_.equals(_))

  // create two streams from the same server origin with identical values
  lazy val c = serverGlitch.map(_ => 1)
  lazy val d = serverGlitch.map(_ => 1)

  // replicate two behaviors from the server to the client
  lazy val cOnClient = c.toAllClients
  lazy val dOnClient = d.toAllClients

  // test client glitches, this value should always be true
  lazy val clientGlitch = cOnClient.combine(dOnClient)(_ == _)

  case class Output(serverGlitch: Boolean, clientGlitch: Boolean) extends Adt
  lazy val OutputRep = adt[Output]

  // combine server and client glitch into 'Output'
  lazy val output = serverGlitch.toAllClients.combine(clientGlitch) { (c, s) =>
    OutputRep(c, s)
  }

  // list all glitch combinations
  lazy val outputs = output.changes.fold(List[Output]()) { (acc, output) => output :: acc }

  def template(outputs: Rep[List[Output]]): Rep[Element] = {
    implicit def viewOps(p: Rep[Output]) = adtOps(p)
    def outputView(output: Rep[Output]): Rep[Element] =
      el('div)(
        el('div)("Glitch-free client: " + output.clientGlitch),
        el('div)("Glitch-free server: " + output.serverGlitch),
        el('hr)())

    el('div)(
      el('h1)("Glitch test"),
      el('div)(
        outputs.map(outputView)),
      el('div)(btn))
  }

  def main: ClientBehavior[Element] = outputs.map(template)
}