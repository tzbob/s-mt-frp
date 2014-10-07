package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol

trait TestGlitches extends MtFrpProg {
  import DefaultJsonProtocol._

  lazy val (btnT, btnE) = button(Click)
  lazy val counter = btnE.fold(0) { (acc, _) => acc + 1 }.changes

  // create two streams from the same origin with identical values on the client
  lazy val one = counter.map(identity)
  lazy val two = counter.map(identity)

  // replicate two streams from the client to the server and turn them into behaviors
  lazy val oneOnServer = one.toServerAnon.hold(0)
  lazy val twoOnServer = two.toServerAnon.hold(0)

  // test server glitches, this value should always be true
  lazy val serverGlitch = oneOnServer.combine(twoOnServer)(_.equals(_))

  // create two streams from the same server origin with identical values
  lazy val three = serverGlitch.map(_ => 1)
  lazy val four = serverGlitch.map(_ => 1)

  // replicate two behaviors from the server to the client
  lazy val threeOnClient = three.toAllClients
  lazy val fourOnClient = four.toAllClients

  // test client glitches, this value should always be true
  lazy val clientGlitch = threeOnClient.combine(fourOnClient)(_ == _)

  case class Output(serverGlitch: Boolean, clientGlitch: Boolean) extends Adt
  lazy val OutputRep = adt[Output]

  // combine server and client glitch into 'Output'
  lazy val output = serverGlitch.toAllClients.combine(clientGlitch) { (c, s) =>
    OutputRep(c, s)
  }

  // list all glitch combinations
  lazy val outputs = output.changes.fold(List[Output]()) { (acc, output) => output :: acc }

  def template(outputs: Rep[List[Output]]): Rep[VNode] = {
    implicit def viewOps(p: Rep[Output]) = adtOps(p)
    def outputView(output: Rep[Output]): Rep[VNode] =
      div(
        div("Glitch-free client: " + output.clientGlitch),
        div("Glitch-free server: " + output.serverGlitch),
        hr())

    div(
      h1("Glitch test"),
      div(outputs.map(outputView)),
      div(btnT("Start")))
  }

  def main: ClientBehavior[VNode] = outputs.map(template)
}