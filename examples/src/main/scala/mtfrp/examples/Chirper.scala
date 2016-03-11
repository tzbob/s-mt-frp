package mtfrp.examples

import mtfrp.lang.Client
import scala.language.implicitConversions
import scala.language.reflectiveCalls

import mtfrp.html.lang.HtmlRunnerLib

import io.circe.generic.auto._

class Chirper extends HtmlRunnerLib {
  case class Chirp(name: String, msg: String) extends Adt
  val ChirpRep = adt[Chirp]
  implicit def chirpOps(p: Rep[Chirp]) = adtOps(p)

  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)
  lazy val (searchT, searchE) = input(Input)

  lazy val submit = {
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior
    val chirp = nameV.map2(msgV) { (n, m) => ChirpRep(n, m) }
    chirp.sampledBy(sendE)
  }

  lazy val search = searchE.asTextEvent.toServer.hold("")

  lazy val submits = submit.toServer.toApplication

  lazy val globalChirps = submits.fold(scala.List.empty[Chirp]){ (acc, newChirps) =>
    acc ++ newChirps.values
  }

  lazy val visibleChirps = globalChirps.toSession.discreteMap2(search) { (chirps, keyword) =>
    chirps.filter(_.msg.contains(keyword))
  }

  def template(chirps: Rep[List[Chirp]]): Rep[Html] = {
    // User Interface definition
    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val search = searchT("type" := "text", "placeholder" := "Search for some chirps...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT()("Submit")

    div()()(
      h1()()("Chirper"), hr()()(),
      div()()(name, msg, send, search),
      div()()(
        h2()()("Chirps"),
        ol()()(chirps.map {
          p => li()()(p.name, " said ", p.msg)
        }),
        hr()()()
      )
    )
  }

  def main = visibleChirps.toClient.map(template)
}
