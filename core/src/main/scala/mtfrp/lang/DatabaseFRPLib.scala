package mtfrp.lang

import scala.slick.jdbc.meta.MTable
import frp.core.Behavior

trait DatabaseFRPLib extends MtFrpProg with DatabaseDefinition {
  import driver.simple._

  trait TableManipulationEvent[T <: Table[_]] {
    private[mtfrp] def tq: TableQuery[T]
    private[mtfrp] def evt: ServerEvent[TableManipulation]
    def toTableBehavior: TableBehavior[T] = TableBehavior(tq, evt)
  }

  implicit class EventToManipulations[A <: TableManipulation](event: ServerEvent[A]) {
    def persistWith[T <: Table[_]](tableQuery: TableQuery[T]): TableBehavior[T] =
      TableBehavior(tableQuery, event)
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

    val manipulationExecution: frp.core.Event[Session => Unit] = manips.map { m =>
      implicit s: Session =>
        m match {
          case Insert(q, d) => q.insert(d)
          case Update(q, d) => q.update(d)
          case Delete(q)    => q.delete
        }
    }

    // create table if it doesn't exist
    database.withSession { implicit session =>
      if (MTable.getTables(tableQuery.baseTableRow.tableName).list.isEmpty) {
        tableQuery.ddl.create
      }
    }

    def select[A](selectQuery: TableQuery[T] => SQLRep[A]): ServerBehavior[A] = {
      select(ServerBehavior(Behavior.constant(selectQuery), ReplicationCore()))
    }

    def select[A](selectBehavior: ServerBehavior[TableQuery[T] => SQLRep[A]]): ServerBehavior[A] = {
      val selectInput = frp.core.EventSource.concerning[A]
      val newSelects = manips.combine(selectBehavior.rep) { (_, q) =>
        s: Session =>
          val result = q(tableQuery).run(s)
          selectInput.fire(result)
      }

      val initialQuery = selectBehavior.rep.initial(tableQuery)
      val initialValue = database.withSession(initialQuery.run(_))

      val newCore = core
        .addManipulations(manipulationExecution)
        .addSelectFires(newSelects)

      ServerBehavior(selectInput.hold(initialValue), newCore)
    }

  }
}
