package mtfrp.examples

import mtfrp.lang._
import scala.language.implicitConversions
import scala.language.reflectiveCalls

import mtfrp.html.lang.HtmlRunnerLib

import io.circe.generic.auto._
import scala.virtualization.lms.common.TupleOps

class ChirperInc extends Chirper {

  case class ChirpsViewD(chirps: List[Chirp], keyword: Option[String]) extends Adt
  implicit def fcuOps(p: Rep[ChirpsViewD]) = adtOps(p)

  lazy val chirpsViewInc: SessionIncBehavior[FilteredChirps, ChirpsViewD] =
    chirps.toSession.incMap2(searchTerm) { (chirps, keyword) =>
      FilteredChirps(chirps.filter(searchSuccess(keyword)), keyword)
    } { (chirps, keyword, increment) =>
      increment match {
        case Left(chirps) =>
          val filteredChirps = chirps.filter(searchSuccess(keyword))
          if (filteredChirps.isEmpty) None
          else Some(ChirpsViewD(filteredChirps, None))
        case Right(keyword) =>
          Some(ChirpsViewD(chirps.filter(searchSuccess(keyword)), Some(keyword)))
        case All(nChirps, keyword) =>
          val newChirps = (chirps ++ nChirps).filter(searchSuccess(keyword))
          Some(ChirpsViewD(newChirps, Some(keyword)))
      }
    } { (fcs, delta) =>
      delta match {
        case ChirpsViewD(chirps, None) => FilteredChirps(fcs.chirps ++ chirps, fcs.kw)
        case ChirpsViewD(chirps, Some(kw)) => FilteredChirps(chirps, kw)
      }
    }

  lazy val clientChirpsInc = chirpsViewInc.toClientWithFold { (state, n) =>
    val cs = state.chirps
    val s = state.kw
    n.keyword.fold(FilteredChirpsRep(cs ++ n.chirps, s), kw => FilteredChirpsRep(n.chirps, kw))
  }

  override def main = clientChirpsInc.map(template)
}
