package smtfrp.examples

import spray.json.DefaultJsonProtocol
import mtfrp.lang.MtFrpProg
import mtfrp.lang.Client
import collection.{ immutable => i }

trait ChatProg extends MtFrpProg {
  import DefaultJsonProtocol._

  case class Entry(
    name: String,
    target: Option[String],
    content: String) extends Adt
  val EntryRep = adt[Entry]
  implicit val itemFormat = jsonFormat3(Entry)

  case class Chat(
    pub: List[Entry] = Nil,
    priv: Map[Client, List[Entry]] = Map() withDefaultValue Nil)
  case class View(pub: List[Entry], priv: List[Entry])
    extends Adt
  implicit val viewFormat = jsonFormat2(View)

  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (tgtT, tgtE) = input(Input)
  lazy val (sendT, sendE) = button(Click)

  def template(view: Rep[View]): Rep[VNode] = {
    implicit def viewOps(p: Rep[View]) = adtOps(p)
    implicit def itemOps(p: Rep[Entry]) = adtOps(p)

    def template(post: Rep[Entry]) = li(post.name, " says ", post.content)
    val contents = view.pub.map(template)
    val privs = view.priv.map(template)

    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val message = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val target = tgtT("type" := "text", "placeholder" := "Enter your target...")()
    val send = sendT("Submit")

    div(
      h1("Multi-tier Chat"), hr(),
      div(name, message, target, send),
      h3("Public"), ol(contents), hr(),
      h3("Private"), ol(privs), hr())
  }

  lazy val submit: ClientEvent[Entry] = {
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior
    val tgtV = tgtE.asTextBehavior

    val combined =
      nameV.combine2(tgtV, msgV) { (n, t, m) =>
        EntryRep(n, if (t == "") none else some(t), m)
      }
    combined.sampledBy(sendE)
  }

  lazy val serverSubmit: ServerEvent[(Client, Entry)] = submit.toServer

  lazy val chat: ServerBehavior[Chat] =
    serverSubmit.fold((Map[String, Client](), Chat())) {
      case ((ppl, c @ Chat(pub, priv)), (sender, entry)) =>
        val newPpl = ppl + (entry.name -> sender)
        val newChat = entry.target match {
          case Some(t) =>
            def cons(c: Client): (Client, List[Entry]) = c -> (entry :: priv(c))
            c.copy(priv = priv + cons(ppl(t)) + cons(sender))
          case None => c.copy(pub = entry :: pub)
        }
        (newPpl, newChat)
    }.map(_._2)

  lazy val clientChat: ServerBehavior[Client => View] =
    chat.map {
      case Chat(pub, priv) =>
        client: Client => View(pub, priv(client))
    }

  def main: ClientBehavior[VNode] = clientChat.toClient.map(template)
}