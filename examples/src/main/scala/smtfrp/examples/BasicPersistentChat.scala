package smtfrp.examples

import spray.json.DefaultJsonProtocol
import collection.{ immutable => imm }
import scala.js.language.Adts
import mtfrp.lang._

trait BasicPersistentChat extends MtFrpProg with DatabaseFRPLib {
  import driver.simple._

  // Data Model
  case class Entry(id: Option[Int], msg: String,
    source: String) extends Adt
  val EntryRep = adt[Entry]

  class Entries(tag: Tag) extends Table[Entry](tag, "TASK") {
    def id = column[Int]("ID", O.PrimaryKey, O.AutoInc)
    def msg = column[String]("MESSAGE")
    def source = column[String]("SOURCE")
    def * = (id.?, msg, source) <>
      (Entry.tupled, Entry.unapply)
  }
  type EntryTable = TableQuery[Entries]
  val entryTable = TableQuery[Entries]

  implicit def entryOps(p: Rep[Entry]) = adtOps(p)
  implicit val entryFormat = jsonFormat3(Entry)

  type ChatLog = List[Entry]
  val defLog: ChatLog = imm.List.empty

  // Interface
  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)

  lazy val nameV = nameE.asTextBehavior
  lazy val msgV = msgE.asTextBehavior

  def template(view: Rep[ChatLog]): Rep[HtmlNode] = {
    def template(post: Rep[Entry]) = li(post.source, " says ", post.msg)
    val contents = view.map(template)

    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val message = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT("Submit")

    div(
      h1("Multi-tier Chat"), hr(),
      div(name, message, send),
      h3("Public"), ol(contents), hr())
  }

  // Core Functionality
  lazy val submit: ClientEvent[Entry] = {
    val combined = nameV.combine(msgV) { (n, m) =>
      EntryRep(none, m, n)
    }
    combined.sampledBy(sendE)
  }

  lazy val serverSubmit: ServerEvent[Entry] = submit.toServerAnon

  lazy val inserts: ServerEvent[TableManipulation] =
    serverSubmit.map { e => Insert(entryTable, e) }

  lazy val persistedEntries: TableBehavior[Entries] =
    inserts.persistWith(entryTable)

  lazy val publicLog: ServerBehavior[ChatLog] =
    persistedEntries.select { table =>
      table.sortBy(_.id.desc).take(100)
    }.map(_.toList).map(id)

  def id[T](x: T) = { System.out.println(x); x }

  def main: ClientBehavior[HtmlNode] = publicLog.toAllClients.map(template)
}