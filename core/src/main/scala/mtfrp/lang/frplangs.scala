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
    with VNodeLib {
  def main: ClientBehavior[VNode]
}

trait MtFrpProgRunner extends MtFrpProgExp { self: MtFrpProg =>
  private[mtfrp] def patchRootNode(behavior: ClientBehavior[VNode]): ClientBehavior[VNode] = {
    val initialState = behavior.rep.markExit(FRP.global).now()
    val rootElem = createElement(initialState)
    document.body.appendChild(rootElem)

    val diffs = behavior.delay.combine(behavior)(diff(_, _))
    diffs.rep.foreach(fun { patch(rootElem, _) }, FRP.global)

    behavior
  }

  private[mtfrp] def run: (Rep[JSBehavior[VNode]], Option[Route]) = {
    val behavior = patchRootNode(main)
    (behavior.rep, behavior.core.route)
  }
}

trait MtFrpProgDbRunner extends MtFrpProgRunner { self: MtFrpProg with DatabaseDefinition =>
  import driver.simple._

  private[mtfrp] def handleDatabaseManipulations(behavior: ClientBehavior[VNode]): ClientBehavior[VNode] = {
    val databaseManipulations = behavior.core.mergedManipulatorDependencies

    databaseManipulations.foreach { map =>
      database.withSession { s: Session =>
        s.withTransaction {
          map.keys.foreach(_(s))
        }
        map.values.foreach(_.foreach(_.trigger(s)))
      }
    }
    behavior
  }

  override private[mtfrp] def run: (Rep[JSBehavior[VNode]], Option[Route]) = {
    val behavior = handleDatabaseManipulations(patchRootNode(main))
    (behavior.rep, behavior.core.route)
  }
}

trait NoDB {
  type Profile = JdbcDriver
  val driver = JdbcDriver
}