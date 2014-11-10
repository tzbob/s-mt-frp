package mtfrp.lang

import scala.slick.driver.JdbcProfile

trait DatabaseFunctionality {
  type Profile <: JdbcProfile
  val driver: Profile
  import driver.simple._
  type SQLRep[T] = driver.simple.Rep[T]

  trait TableManipulation

  case class Insert[D](query: Query[_, D, Seq], data: D)
    extends TableManipulation
  case class Update[D](query: Query[SQLRep[D], D, Seq], data: D)
    extends TableManipulation
  case class Delete(query: Query[_ <: Table[_], _ <: Any, Seq])
    extends TableManipulation
}
