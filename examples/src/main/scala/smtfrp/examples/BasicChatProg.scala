package smtfrp.examples

import spray.json.DefaultJsonProtocol
import mtfrp.lang.MtFrpProg
import mtfrp.lang.Client

trait BasicChatProg extends MtFrpProg {
  import DefaultJsonProtocol._

  case class Entry(name: String, msg: String) extends Adt
  val EntryRep = adt[Entry]
  implicit val itemFormat = jsonFormat2(Entry)

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

  lazy val chat: ServerIncBehavior[List[Entry], Entry] =
    submit.toServerAnon.fold(scala.List.empty[Entry]) { (acc, n) =>
      n :: acc
    }

  def template(view: Rep[List[Entry]]): Rep[Html] = {
    implicit def itemOps(p: Rep[Entry]) = adtOps(p)

    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val send = sendT()("Submit")

    div()()(
      h1()()("Multi-tier Chat"), hr()()(),
      div()()(name, msg, send),
      h3()()("Public"),
      ol()()(view.map {
        p => li()()(p.name, " says ", p.msg)
      }),
      hr()()()
    )
  }

  lazy val main: ClientDiscreteBehavior[Html] = chat.toAllClients {
    fun {
      (entries, entry) => entry :: entries
    }
  }.map(template _)
}
