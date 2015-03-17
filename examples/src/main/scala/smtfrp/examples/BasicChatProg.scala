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
    val entryMaker = msgV.map(fun { msg =>
      fun((name: Rep[String]) => EntryRep(name, msg))
    })
    val entry = nameV.reverseApply(entryMaker)
    val snapshotter: ClientEvent[Entry => Entry] = sendE.map(fun { _ =>
      identity[Rep[Entry]] _
    })
    entry.snapshotWith(snapshotter)
  }

  lazy val chat: ServerDiscreteBehavior[List[Entry]] =
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
      h3()()("Public"), ol()()(view.map { p => li()()(p.name, " says ", p.msg) }), hr()()()
    )
  }

  lazy val main: ClientDiscreteBehavior[Html] = chat.toAllClients.map(template _)
}
