package mtfrp.lang

import scala.slick.jdbc.meta.MTable

trait DatabaseFRPLib extends MtFrpProg with DatabaseDefinition {
  import driver.simple._

  override private[mtfrp] def addHTMLUpdates: ClientBehavior[Element] = {
    val behavior = super.addHTMLUpdates

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

  trait TableManipulationEvent[T <: Table[_]] {
    private[mtfrp] def tq: TableQuery[T]
    private[mtfrp] def evt: ServerEvent[TableManipulation]
    def toTableBehavior: TableBehavior[T] = TableBehavior(tq, evt)
  }

  implicit class ToQueryEvent[A](event: ServerEvent[A]) {
    def toTableManipulation[T <: Table[_]](tableQuery: TableQuery[T])(
      mapping: (TableQuery[T], A) => TableManipulation): TableManipulationEvent[T] =
      new TableManipulationEvent[T] {
        val tq = tableQuery
        val evt = event.map(mapping(tableQuery, _))
      }
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

      val beh = rawDbInput.hold(start)
      val newCore = core.addManipulationDependencies(manipulator)
      ServerBehavior(beh, newCore)
    }
  }
}