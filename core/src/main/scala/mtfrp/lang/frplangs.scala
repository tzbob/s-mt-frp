package mtfrp.lang

import scala.js.language.Adts
import scala.js.language.dom.Browser
import forest.Forest
import spray.json.DefaultJsonProtocol
import spray.routing.Route
import scala.slick.driver.JdbcProfile
import scala.slick.driver.JdbcDriver
import mtfrp.exp.MtFrpProgExp

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
  extends MtFrpLib
  with FrpExtensions
  with Forest
  with Browser
  with Adts
  with DocumentOpsExtended
  with DefaultJsonProtocol
  with HtmlNodeLib {
  def main: ClientBehavior[HtmlNode]
  //  val ontick: Rep[Unit => Unit]
}

trait MtFrpProgRunner extends MtFrpProgExp { self: MtFrpProg =>
  private[mtfrp] def transformMain(behavior: ClientBehavior[HtmlNode]): ClientBehavior[HtmlNode] = {
    val initialState = behavior.rep.markExit(FRP.global).now()
    val rootElem = createElement(initialState)
    document.body.appendChild(rootElem)

    val diffs = behavior.delay.combine(behavior)(diff(_, _))
    diffs.rep.foreach(fun {
      patch(rootElem, _)
    }, FRP.global)
    //    behavior.rep.changes.foreach(fun { _ => ontick(()) }, FRP.global)

    behavior
  }

  private[mtfrp] def run: (Rep[JSBehavior[HtmlNode]], Option[Route]) = {
    val behavior = transformMain(main)
    val rep = behavior.rep
    val route = behavior.core.route
    (rep, route)
  }
}

trait MtFrpProgDbRunner extends MtFrpProgRunner { self: MtFrpProg with DatabaseDefinition =>
  import driver.simple._

  override private[mtfrp] def transformMain(behavior: ClientBehavior[HtmlNode]): ClientBehavior[HtmlNode] = {
    val beh = super.transformMain(behavior)
    val databaseManipulations = beh.core.mergedDatabaseActions

    databaseManipulations.foreach { seq =>
      database.withSession { s: Session =>
        s.withTransaction {
          seq.foreach(_(s))
        }
      }
    }
    beh
  }
}

trait NoDB {
  type Profile = JdbcDriver
  val driver = JdbcDriver
}
