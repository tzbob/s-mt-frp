package mtfrp.exp

import mtfrp.lang.HtmlNodeBuilderLib
import scala.js.exp.dom.EventOpsExp
import scala.js.exp.JSMapsExp
import scala.js.exp.JSExp
import scala.js.exp.dom.ElementOpsExp

trait HtmlNodeBuilderLibExp extends HtmlNodeBuilderLib with ClientFRPLibExp with EventOpsExp with JSMapsExp with JSExp with ElementOpsExp {
  case class CreateElem(node: Exp[HtmlNode]) extends Def[Element]
  def createElement(vnode: Exp[HtmlNode]): Exp[Element] = CreateElem(vnode)

  case class Diff(prev: Exp[HtmlNode], current: Exp[HtmlNode]) extends Def[HtmlNodeDiff]
  def diff(prev: Exp[HtmlNode], current: Exp[HtmlNode]): Exp[HtmlNodeDiff] =
    Diff(prev, current)

  case class Patch(root: Exp[Element], patch: Exp[HtmlNodeDiff]) extends Def[Unit]
  def patch(rootNode: Exp[Element], diff: Exp[HtmlNodeDiff]): Exp[Unit] =
    reflectEffect(Patch(rootNode, diff))

  case class MkText(str: Exp[String]) extends Def[HtmlNode]
  def mkText(str: Exp[String]): Exp[HtmlNode] = MkText(str)

  case class MkNode(
    tag: Exp[String],
    attributes: Exp[Map[String, Any]],
    children: Exp[List[HtmlNode]]) extends Def[HtmlNode]
  def mkNode(
    tagName: Exp[String],
    handlers: Handlers,
    attributes: Attributes,
    children: Children): Exp[HtmlNode] = {

    val properties = JSMap[String, Any]()
    properties.update("attributes", attributes)

    handlers.foreach { h =>
      implicit val m: Manifest[h.eventDef.Type] = h.m
      properties.update("on" + h.eventDef.name, h.eventHandler)
    }

    MkNode(tagName, properties, children)
  }

}