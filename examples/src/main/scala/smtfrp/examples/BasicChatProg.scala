package smtfrp.examples

import spray.json.DefaultJsonProtocol
import mtfrp.lang.MtFrpProg
import mtfrp.lang.Client
import collection.immutable.{ List => SList }
import frp.core.DeltaApplicator

trait BasicChatProg extends MtFrpProg {
  import DefaultJsonProtocol._

  case class Entry(name: String, msg: String) extends Adt
  val EntryRep: (Rep[String], Rep[String]) => Rep[Entry] = adt[Entry]
  implicit val itemFormat = jsonFormat2(Entry)

  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)

  lazy val submit: ClientEvent[Entry] = {
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior
    val entry = nameV.combine(msgV) { EntryRep(_, _) }
    entry.sampledBy(sendE)
  }

  def serverListPrepender[A] = new ServerDeltaApplicator[List[A], A] {
    def apply(acc: List[A], delta: A): List[A] = delta :: acc
  }

  def clientListPrepender[A: Manifest] = new ClientDeltaApplicator[List[A], A] {
    def apply(acc: Rep[List[A]], delta: Rep[A]): Rep[List[A]] = delta :: acc
  }

  lazy val chat: ServerIncBehavior[Entry, List[Entry]] =
    submit.toServerAnon.incFold(SList.empty[Entry])(serverListPrepender)

  def template(view: Rep[List[Entry]]): Rep[VNode] = {
    implicit def itemOps(p: Rep[Entry]) = adtOps(p)

    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT("Submit")

    div(
      h1("Multi-tier Chat"), hr(),
      div(name, msg, send),
      h3("Public"), ol(view.map { p => li(p.name, " says ", p.msg) }), hr())
  }

  lazy val main: ClientBehavior[VNode] =
    chat.toAllClients(clientListPrepender).map(template)
}