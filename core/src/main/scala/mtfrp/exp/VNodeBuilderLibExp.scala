package mtfrp.exp

import mtfrp.lang.VNodeBuilderLib
import scala.js.exp.dom.EventOpsExp
import scala.js.exp.JSMapsExp
import scala.js.exp.JSExp
import scala.js.exp.dom.ElementOpsExp

trait VNodeBuilderLibExp extends VNodeBuilderLib with ClientFRPLibExp with EventOpsExp with JSMapsExp with JSExp with ElementOpsExp {
  case class CreateElem(node: Exp[VNode]) extends Def[Element]
  def createElement(vnode: Exp[VNode]): Exp[Element] = CreateElem(vnode)

  case class Diff(prev: Exp[VNode], current: Exp[VNode]) extends Def[VNodeDiff]
  def diff(prev: Exp[VNode], current: Exp[VNode]): Exp[VNodeDiff] =
    Diff(prev, current)

  case class Patch(root: Exp[Element], patch: Exp[VNodeDiff]) extends Def[Unit]
  def patch(rootNode: Exp[Element], diff: Exp[VNodeDiff]): Exp[Unit] =
    reflectEffect(Patch(rootNode, diff))

  case class MkText(str: Exp[String]) extends Def[VNode]
  def mkText(str: Exp[String]): Exp[VNode] = MkText(str)

  case class MkNode(
    tag: Exp[String],
    properties: Exp[Map[String, Any]],
    children: Exp[List[VNode]]) extends Def[VNode]
  def mkNode(
    tagName: Exp[String],
    handlers: Handlers,
    properties: Properties,
    children: Children): Exp[VNode] = {

    handlers.foreach { h =>
      implicit val m: Manifest[h.eventDef.Type] = h.m
      properties.update("on" + h.eventDef.name, h.eventHandler)
    }

    MkNode(tagName, properties, children)
  }

}