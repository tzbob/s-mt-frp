package smtfrp.examples

import mtfrp.lang._
import mtfrp.exp._
import scala.js.exp.FFIExp

trait DatabaseBenchmark extends MtFrpProg with FFIExp with DatabaseFRPLib with Utils {
  import driver.simple._

  class Messages(tag: Tag) extends Table[(Int, String)](tag, "MESSAGE") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def msg = column[String]("MESSAGE")
    def * = (id, msg)
  }

  val msgTable = TableQuery[Messages]

  var n: Long = 0
  var old: Long = System.currentTimeMillis()
  var old10000: Long = System.currentTimeMillis()

  lazy val (sendT, sendE) = button(Click)
  lazy val serverE: ServerEvent[String] = sendE.map { _ =>
    foreign"Math.random().toString(36).substring(7)"[String].withEffect()
  }.toServerAnon

  lazy val inserts: ServerEvent[TableManipulation] =
    serverE.map { e => Insert(msgTable, (0, e)) }

  lazy val persistedEntries: TableBehavior[Messages] =
    inserts.persistWith(msgTable)

  lazy val publicLog: ServerBehavior[List[String]] =
    persistedEntries.select { table =>
      table.sortBy(_.id.asc).map(_.msg).take(400)
    }.map { x =>
      n += 1

      val did100: Boolean = n % 100 == 0
      val did10000: Boolean = n % 10000 == 0

      if (did10000) {
        val now = System.currentTimeMillis()
        val diff = now - old10000
        System.out.println(s"100000 requests processed within $diff ms, avg: ${10000.0 / diff * 1000} req/ms")
        old10000 = now
      }

      if (did100) {
        val now = System.currentTimeMillis()
        val diff = now - old
        System.out.println(s"100 requests processed within $diff ms, avg: ${100.0 / diff * 1000} req/ms")
        old = now
      }
      x.toList
    }

  lazy val incLog = publicLog.incrementalize(serverDiffer)

  def template(view: Rep[List[String]]): Rep[HtmlNode] = {
    def template(post: Rep[String]) = li(post)
    val contents = view.map(template)
    div(
      sendT("id" := "btn")("Submit"),
      ol(contents)
    )
  }

  def main: ClientBehavior[HtmlNode] = incLog.toAllClients(clientPatcher).map(template)
}
