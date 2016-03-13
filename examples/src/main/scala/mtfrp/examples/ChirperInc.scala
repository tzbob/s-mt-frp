package mtfrp.examples

import mtfrp.lang._
import scala.language.implicitConversions
import scala.language.reflectiveCalls

import mtfrp.html.lang.HtmlRunnerLib

import io.circe.generic.auto._
import scala.virtualization.lms.common.TupleOps

class ChirperInc extends HtmlRunnerLib {
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

  lazy val chirps: SessionIncBehavior[List[Chirp], List[Chirp]] =
    submit.toServer.toAppAnon.fold(scala.List.empty[Chirp]) { (acc, n) => acc ++ n }.toSession

  lazy val keyword: SessionIncBehavior[String, String] = searchE.asTextEvent.toServer.hold("")

  case class FilteredChirpsUpdate(chirps: List[Chirp], keyword: Option[String]) extends Adt
  implicit def fcuOps(p: Rep[FilteredChirpsUpdate]) = adtOps(p)

  case class FilteredChirps(chirps: List[Chirp], kw: String) extends Adt
  val FilteredChirpsRep = adt[FilteredChirps]
  implicit def fcOps(p: Rep[FilteredChirps]) = adtOps(p)

  def searchSuccess(kw: String)(c: Chirp) = c.msg.contains(kw)

  lazy val filteredChirps: SessionIncBehavior[FilteredChirps, FilteredChirpsUpdate] =
    chirps.incMap2(keyword) { (chirps: List[Chirp], keyword: String) =>
      FilteredChirps(chirps.filter(searchSuccess(keyword)), keyword)
    } { (chirps, keyword, increment) =>
      increment match {
        case Left(chirps) =>
          val filteredChirps = chirps.filter(searchSuccess(keyword))
          if (filteredChirps.isEmpty) None
          else Some(FilteredChirpsUpdate(filteredChirps, None))
        case Right(keyword) =>
          Some(FilteredChirpsUpdate(chirps.filter(searchSuccess(keyword)), Some(keyword)))
        case All(nChirps, keyword) =>
          val newChirps = (chirps ++ nChirps).filter(searchSuccess(keyword))
          Some(FilteredChirpsUpdate(newChirps, Some(keyword)))
      }
    } { (fcs, delta) =>
      delta match {
        case FilteredChirpsUpdate(chirps, None) => FilteredChirps(fcs.chirps ++ chirps, fcs.kw)
        case FilteredChirpsUpdate(chirps, Some(kw)) => FilteredChirps(chirps, kw)
      }
    }

  lazy val clientChirps = filteredChirps.toClientWithFold { (state, n) =>
    val cs = state.chirps
    val s = state.kw
    n.keyword.fold(FilteredChirpsRep(cs ++ n.chirps, s), kw => FilteredChirpsRep(n.chirps, kw))
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

  def main = clientChirps.map(template)
}
