package mtfrp.lang

import scala.slick.jdbc.meta.MTable

trait DatabaseFRPLib extends MtFrpProg with DatabaseDefinition {
  import driver.simple._

  override private[mtfrp] def addHTMLUpdates: ClientBehavior[Element] = {
    val behavior = super.addHTMLUpdates

    val databaseManipulations = behavior.core.mergedManipulatorDependencies
    databaseManipulations.foreach { map =>
      database.withSession { s: Session =>
        map.keys.foreach(_(s))
        map.values.foreach(_.foreach(_.trigger(s)))
      }
    }
    behavior
  }

  implicit class DatabaseEvent(evt: ServerEvent[TableManipulation]) {
    def toTableBehavior[T <: Table[_]](tableQuery: TableQuery[T]): TableBehavior[T] =
      TableBehavior(tableQuery, evt)
  }

  object TableBehavior {
    def apply[T <: Table[_]](
      tableQuery: TableQuery[T],
      evt: ServerEvent[TableManipulation]): TableBehavior[T] =
      new TableBehavior(tableQuery, evt.core, evt.rep)
  }

  class TableBehavior[T <: Table[_]](
      val tableQuery: TableQuery[T],
      val core: ReplicationCore,
      val manips: frp.core.Event[TableManipulation]) {

    def select[A](q: TableQuery[T] => SQLRep[A]): ServerBehavior[A] = {
      val rawDbInput = frp.core.EventSource.concerning[A]
      val query = q(tableQuery)
      val start = database.withSession { implicit session =>
        if (MTable.getTables(tableQuery.baseTableRow.tableName).list.isEmpty)
          tableQuery.ddl.create
        query.run
      }

      def triggerSelect(session: Session): Unit = {
        val newQueryResult = database.withSession(query.run(_))
        rawDbInput.fire(newQueryResult)
      }

      def executeManipulation(manip: TableManipulation)(session: Session): Unit = {
        implicit val implSession = session
        manip match {
          case Insert(q, d) => q.insert(d)
          case Update(q, d) => q.update(d)
          case Delete(q)    => q.delete
        }
      }

      val manipulator = manips.map { manipulation =>
        ManipulationDependency(triggerSelect _, executeManipulation(manipulation)_)
      }

      val newCore = core.addManipulationDependencies(manipulator)
      ServerEvent(rawDbInput, newCore).hold(start)
    }
  }
}