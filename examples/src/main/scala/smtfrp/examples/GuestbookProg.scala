package smtfrp.examples

import mtfrp.lang.MtFrpProg
import spray.json.DefaultJsonProtocol
import collection.{ immutable => i }
import mtfrp.lang.Client

trait GuestbookProg extends MtFrpProg with EasyHTML {
  import DefaultJsonProtocol._

  case class Entry(name: String, text: String) extends Adt
  val ClientEntry = adt[Entry]
  implicit val entryFormat = jsonFormat2(Entry)

  def main: ClientBehavior[Element] = book.toAllClients map template

  def template(data: Rep[List[Entry]]): Rep[Element] = {
    implicit def entryOps(p: Rep[Entry]) = adtOps(p)
    val entryEls = for (entry <- data)
      yield el('li)(entry.name, " says ", entry.text)

    el('div)(
      el('h1)("Guestbook Prog"),
      el('ol)(entryEls),
      el('div)(name, text, send)
    )
  }

  lazy val book: ServerBehavior[i.List[Entry]] =
    input.toServerAnon.fhold(i.List.empty[Entry]) {
      case (acc, entry) => entry :: acc
    }

  lazy val input: ClientEvent[Entry] = {
    val combined = name.values.combine(text.values) { ClientEntry(_, _) }
    combined sampledBy send.toStream(Click)
  }

  lazy val name: Rep[Input] = text("Name")
  lazy val text: Rep[Input] = text("Text")
  lazy val send: Rep[Button] = button("Send")
}