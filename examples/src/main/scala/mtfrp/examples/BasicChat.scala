package mtfrp.examples

import scala.language.implicitConversions
import scala.language.reflectiveCalls

import mtfrp.html.lang.HtmlRunnerLib

import io.circe.generic.auto._

class BasicChat extends HtmlRunnerLib {
  case class Entry(to: Option[String], name: String, msg: String) extends Adt
  val EntryRep = adt[Entry]

  implicit def entryOps(p: Rep[Entry]) = adtOps(p)

  lazy val (toT, toE) = input(Input)
  lazy val (nameT, nameE) = input(Input)
  lazy val (msgT, msgE) = input(Input)
  lazy val (sendT, sendE) = button(Click)

  lazy val (globalT, globalE) = input(Input)

  lazy val globalV = globalE.asCheckedBehavior(false)

  lazy val submit = {
    val toV = toE.asTextBehavior
    val nameV = nameE.asTextBehavior
    val msgV = msgE.asTextBehavior

    val entry = toV.map3(nameV, msgV) { (to, name, msg) =>
      EntryRep(some(to), name, msg)
    }

    val filteredEntry = globalV.map2(entry) { (isGlobal, entry) =>
      if (isGlobal) entry.copy(to = none)
      else entry
    }

    filteredEntry.sampledBy(sendE)
  }

  lazy val applicationSubmits = submit.toServerAnon

  lazy val globalChat = applicationSubmits.fold(scala.List.empty[Entry]) { (acc, n) => n :: acc }

  // lazy val connectedChatters: ApplicationBehavior[Map[Client, String]] = {
  //   ???
  // }

  // def template(pub: Rep[List[Entry]], priv: Rep[List[Entry]]): Rep[Html] = {
  def template(showTo: Rep[Boolean], pub: Rep[List[Entry]]): Rep[Html] = {
    val name = nameT("type" := "text", "placeholder" := "Enter your name...")()
    val msg = msgT("type" := "text", "placeholder" := "Enter your message...")()
    val to = toT("type" := "text", "placeholder" := "Enter your target")()
    val global = label()()(toT("type" := "checkbox", "id" := "toChk")("Submit"), "Global")
    val send = sendT()("Submit")

    def makeSection(title: Rep[String], view: Rep[List[Entry]]) =
      div()()(
        h2()()(title),
        ol()()(view.map {
          p => li()()(p.name, " says ", p.msg)
        }),
        hr()()()
      )

    div()()(
      h1()()("Multi-tier Chat"), hr()()(),
      div()()(name, msg, send),
      if (showTo) to else span()()(),
      makeSection("Public", pub)
      // makeSection("Private", priv)
    )
  }

  lazy val broadcasted = globalChat.toAllClients { (entries, entry) =>
    entry :: entries
  }

  def main = globalV.discreteMap2(broadcasted)(template _)
}
