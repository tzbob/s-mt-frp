package mtfrp.examples

import mtfrp.lang._
import scala.language.implicitConversions
import scala.language.reflectiveCalls

import mtfrp.html.lang.HtmlRunnerLib

import io.circe.generic.auto._
import scala.virtualization.lms.common.TupleOps

class Chirper extends HtmlRunnerLib {
  case class Chirp(name: String, msg: String) extends Adt
  val ChirpRep = adt[Chirp]
  implicit def chirpOps(p: Rep[Chirp]) = adtOps(p)

  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)
  lazy val (searchT, searchE) = input(Input)

  lazy val chirp = {
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior
    val chirp = nameV.map2(msgV) { (n, m) => ChirpRep(n, m) }
    chirp.sampledBy(sendE)
  }

  lazy val chirps: ApplicationIncBehavior[List[Chirp], List[Chirp]] =
    chirp.toServer.toApplication.map(m => m.values.toList).fold(scala.List.empty[Chirp]) { (acc, n) => acc ++ n }

  lazy val searchTerm: SessionIncBehavior[String, String] = searchE.asTextEvent.toServer.fold("") { (_, x) => x }

  case class FilteredChirps(chirps: List[Chirp], kw: String) extends Adt
  val FilteredChirpsRep = adt[FilteredChirps]
  implicit def fcOps(p: Rep[FilteredChirps]) = adtOps(p)

  def searchSuccess(kw: String)(c: Chirp) = c.msg.contains(kw)

  lazy val chirpsView: SessionDiscreteBehavior[FilteredChirps] =
    chirps.toSession.discreteMap2(searchTerm) { (chirps, keyword) =>
      FilteredChirps(chirps.filter(searchSuccess(keyword)), keyword)
    }

  def template(state: Rep[FilteredChirps]): Rep[Html] = {
    val chirps = state.chirps
    val kw = state.kw

    // User Interface definition
    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val search = searchT("type" := "text", "placeholder" := "Search for some chirps...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT()("Submit")

    div()()(
      h1()()("Chirper"), hr()()(),
      div()()(name, msg, send, search),
      div()()(
        h2()()("Chirps for: " + kw),
        ol()()(chirps.map {
          p => li()()(p.name, " said ", p.msg)
        }),
        hr()()()
      )
    )
  }

  def main = chirpsView.toClient.map(template)
}
