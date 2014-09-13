package smtfrp.examples

import spray.json.DefaultJsonProtocol
import mtfrp.lang.MtFrpProg
import mtfrp.lang.Client
import collection.{ immutable => i }

trait ChatProg extends MtFrpProg with EasyHTML {
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

  lazy val name: Rep[Input] = text("Name")
  lazy val message: Rep[Input] = text("Message")
  lazy val target: Rep[Input] = text("Target")
  lazy val send: Rep[Button] = button("Send")

  def template(view: Rep[View]): Rep[Element] = {
    implicit def viewOps(p: Rep[View]) = adtOps(p)
    implicit def itemOps(p: Rep[Entry]) = adtOps(p)
    def template(post: Rep[Entry]) = el('li)(post.name, " says ", post.content)
    val contents = view.pub.map(template)
    val privs = view.priv.map(template)

    el('div)(
      el('h1)("Multi-tier Chat"), el('hr)(),
      el('div)(name, message, target, send),
      el('h3)("Public"), el('ol)(contents), el('hr)(),
      el('h3)("Private"), el('ol)(privs), el('hr)())
  }

  lazy val submit: ClientEvent[Entry] = {
    val combined: ClientBehavior[Entry] =
      name.values.combine(target.values, message.values) { (n, t, m) =>
        EntryRep(n, if (t == "") none else some(t), m)
      }
    combined.sampledBy(send.toStream(Click))
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

  def main: ClientBehavior[Element] = clientChat.toClient.map(template)
}