package smtfrp.examples

import collection.immutable.{ List => SList }
import scala.js.language._
import mtfrp.lang._
import spray.json.DefaultJsonProtocol
import scala.slick.driver.H2Driver

/**
 * Model the application domain
 */
trait TodoModel extends Adts with DefaultJsonProtocol with DatabaseFunctionality {
  import driver.simple._

  case class Task(id: Option[Int], description: String) extends Adt
  implicit def taskOps(p: Rep[Task]) = adtOps(p)
  implicit val taskFormat = jsonFormat2(Task)
  val TaskRep = adt[Task]

  class Tasks(tag: Tag) extends Table[Task](tag, "TASK") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def description = column[String]("DESCRIPTION")
    def * = (id.?, description) <> (Task.tupled, Task.unapply)
  }
  val taskQuery = TableQuery[Tasks]

  type ServerState = List[Task]
  type TaskQuery = TableQuery[Tasks]
}

/**
 * Design the interface elements
 */
trait TodoInterface extends TodoModel with HtmlNodeLib with FrpExtensions {
  lazy val (newTaskT, newTaskInputE, newTaskKeyE) = input(Input, KeyUp)

  def interface(state: Rep[ServerState]): Rep[HtmlNode] = div(
    h1("Todo Example"),
    div(newTaskT("type" := "text", "placeholder" := "What needs to be done?")()),
    ol(template(state)), hr())

  def template(state: Rep[ServerState]): Rep[HtmlNode] = {
    def template(task: Rep[Task]): Rep[HtmlNode] = li(task.description)
    ol(state.map(template))
  }
}

/**
 * Design the updates of the state in the application
 */
trait TodoUpdate extends TodoModel with MtFrpProg {
  import driver.simple._

  def toInsert(tq: TaskQuery, newDesc: String) = Insert(tq, Task(None, newDesc))
  def toDelete(tq: TaskQuery, id: Int) = Delete(tq.filter(_.id === id))
}

/**
 * Wrap everything together
 */
trait TodoCore extends TodoInterface with TodoUpdate with MtFrpProg with DatabaseFRPLib {
  lazy val enters = newTaskKeyE.filter(_.keyCode == 13)
  lazy val values = newTaskInputE.asTextBehavior

  lazy val newTasks = values.sampledBy(enters).toServerAnon
  lazy val taskInserts = newTasks.toTableManipulation(taskQuery)(toInsert)

  lazy val taskTableBehavior: TableBehavior[Tasks] = taskInserts.toTableBehavior

  lazy val tasks: ServerBehavior[List[Task]] =
    taskTableBehavior.select(identity(_)).map(_.toList)

  def main: ClientBehavior[HtmlNode] = tasks.toAllClients.map(interface)
}
