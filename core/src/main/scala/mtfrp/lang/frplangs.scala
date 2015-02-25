package mtfrp.lang

import mtfrp.exp.MtFrpProgExp
import scala.js.language._
import scala.js.language.dom.Browser
import scala.slick.driver.{JdbcDriver, JdbcProfile}
import spray.json.DefaultJsonProtocol
import spray.routing.Route

import hokko.core.Behavior

trait MtFrpLib
  extends ClientFRPLib
  with ServerFRPLib
  with ReplicationFRPLib

trait MtFrpProg
  extends MtFrpLib
  with FrpExtensions
  with Browser
  with Adts
  with DocumentOpsExtended
  with DefaultJsonProtocol
  with HtmlNodeLib
  with JS {
  def main: ClientBehavior[HtmlNode]
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

    behavior
  }

  private[mtfrp] def run: (Rep[Behavior[HtmlNode]], Option[Route]) = {
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
