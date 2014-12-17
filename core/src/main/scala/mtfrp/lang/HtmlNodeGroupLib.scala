package mtfrp.lang

trait HtmlNodeGroupLib extends HtmlNodeBuilderLib {
  implicit class GroupEventTargetBuilder(b: EventTargetBuilder) {
    def group: GroupBuilder = new GroupBuilder(b.tagName)
  }

  trait GroupHandler[A] extends Serializable {
    implicit val m1: Manifest[A]
    implicit val m2: Manifest[eventDef.Type]
    val eventDef: EventDef
    val eventHandler: Rep[((A, eventDef.Type)) => Unit]

    def toHandler(const: Rep[A]): Handler = {
      val constHandler = (e: Rep[eventDef.Type]) =>
        eventHandler(make_tuple2((const, e)))
      Handler(eventDef)(constHandler)
    }
  }

  object GroupHandler {
    def apply[A: Manifest](evtDef: EventDef)(evtHandler: Rep[(A, evtDef.Type)] => Rep[Unit])(implicit m: Manifest[evtDef.Type]) =
      new GroupHandler[A] {
        val m1: Manifest[A] = implicitly[Manifest[A]]
        val m2: Manifest[eventDef.Type] = m
        // help the typechecker with a singleton type
        val eventDef: evtDef.type = evtDef
        val eventHandler = fun(evtHandler)
      }
  }

  type GroupHandlers[Id] = List[GroupHandler[Id]]

  private def handleGroupEvent[A: Manifest](ev: EventDef)(implicit m: Manifest[ev.Type]): (ClientEvent[(A, ev.Type)], GroupHandler[A]) = {
    val evt = FRP.eventSource[(A, ev.Type)](FRP.global)
    (ClientEvent(evt, ReplicationCore()), GroupHandler(ev)(evt.fire))
  }

  class GroupBuilder(tagName: Rep[String]) {
    def apply[Id: Manifest](ev1: EventDef)(implicit m: Manifest[ev1.Type]): (TemplatedHtmlNodeBuilder[Id], ClientEvent[(Id, ev1.Type)]) = {
      val (evt, handler) = handleGroupEvent[Id](ev1)
      (new TemplatedHtmlNodeBuilder(tagName, handler +: Nil), evt)
    }

    // ugly boilerplate...
    def apply[Id: Manifest](ev1: EventDef, ev2: EventDef)(implicit m1: Manifest[ev1.Type], m2: Manifest[ev2.Type]): (TemplatedHtmlNodeBuilder[Id], ClientEvent[(Id, ev1.Type)], ClientEvent[(Id, ev2.Type)]) = {
      val (evt1, handler1) = handleGroupEvent[Id](ev1)
      val (evt2, handler2) = handleGroupEvent[Id](ev2)

      val handlers = handler2 +: handler1 +: Nil
      (new TemplatedHtmlNodeBuilder(tagName, handlers), evt1, evt2)
    }
    // ... 3,4,5..
  }

  class TemplatedHtmlNodeBuilder[Id: Manifest](tagName: Rep[String], groupHandlers: GroupHandlers[Id]) {
    private def toHtmlNodeBuilder(id: Rep[Id]): HtmlNodeBuilder = {
      val handlers = groupHandlers.map(_.toHandler(id))
      new HtmlNodeBuilder(tagName, handlers)
    }
    def apply(id: Rep[Id]): Rep[HtmlNode] = toHtmlNodeBuilder(id)()
    def apply(id: Rep[Id], children: Value[HtmlNode]*): Rep[HtmlNode] =
      toHtmlNodeBuilder(id)(children: _*)
    def apply(id: Rep[Id], attrs: Value[Attribute]*)(children: Value[HtmlNode]*): Rep[HtmlNode] =
      toHtmlNodeBuilder(id)(attrs: _*)(children: _*)
  }

}
