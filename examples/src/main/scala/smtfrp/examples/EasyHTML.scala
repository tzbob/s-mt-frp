package smtfrp.examples

import mtfrp.lang.MtFrpProg

trait EasyHTML extends MtFrpProg {
  def createInput(tp: Rep[String], placeholder: Rep[String]): Rep[Input] = {
    val el = document createElement InputTag
    el.setAttribute("type", tp)
    el.setAttribute("placeholder", placeholder)
    el
  }

  def text(placeholder: Rep[String]): Rep[Input] =
    createInput("text", placeholder)

  def button(name: Rep[String]): Rep[Button] = {
    val send = document createElement ButtonTag
    send.setInnerHTML(name)
    send
  }
}