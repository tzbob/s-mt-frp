package mtfrp.examples

import scala.language.implicitConversions

import mtfrp.html.lang.HtmlRunnerLib

import io.circe.generic.auto._

class BasicChat extends HtmlRunnerLib {
  case class Entry(name: String, msg: String) extends Adt
  val EntryRep = adt[Entry]

  implicit def entryOps(p: Rep[Entry]) = adtOps(p)

  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)

  lazy val submit = {
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior

    val entry = nameV.map2(msgV)(fun { (name, msg) =>
      EntryRep(name, msg)
    })

    entry.sampledBy(sendE)
  }

  lazy val globalChat = {
    val applicationSubmits = submit.toServerAnon
    applicationSubmits.fold(scala.List.empty[Entry]) { (acc, n) => n :: acc }
  }

  def template(view: Rep[List[Entry]]): Rep[Html] = {
    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT()("Submit")

    div()()(
      h1()()("Multi-tier Chat"), hr()()(),
      div()()(name, msg, send),
      h2()()("Public"),
      ol()()(view.map {
        p => li()()(p.name, " says ", p.msg)
      }),
      hr()()()
    )
  }

  lazy val broadcasted = globalChat.toAllClients { (entries, entry) =>
    entry :: entries
  }

  def main = broadcasted.map(template _)
}
