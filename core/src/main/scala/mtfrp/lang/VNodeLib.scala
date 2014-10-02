package mtfrp.lang

trait VNodeLib extends VNodeGroupLib {
  import VNodeImplicits._

  object VNodeImplicits {
    implicit class TargetBuilderString(k: String) {
      def asTag: EventTargetBuilder = new EventTargetBuilder(k)
    }
  }

  /*
   * Scala Value definitions thanks to the ScalaTags project: 
   * 	https://github.com/lihaoyi/scalatags/
   */

  // Sections
  val h1 = "h1".asTag
  val h2 = "h2".asTag
  val h3 = "h3".asTag
  val h4 = "h4".asTag
  val h5 = "h5".asTag
  val h6 = "h6".asTag
  val header = "header".asTag
  val footer = "footer".asTag
  // Grouping content
  val p = "p".asTag
  val hr = "hr".asTag
  val pre = "pre".asTag
  val blockquote = "blockquote".asTag
  val ol = "ol".asTag
  val ul = "ul".asTag
  val li = "li".asTag
  val dl = "dl".asTag
  val dt = "dt".asTag
  val dd = "dd".asTag
  val figure = "figure".asTag
  val figcaption = "figcaption".asTag
  val div = "div".asTag
  // Text-level semantics
  val a = "a".asTag
  val em = "em".asTag
  val strong = "strong".asTag
  val small = "small".asTag
  val s = "s".asTag
  val cite = "cite".asTag
  val code = "code".asTag
  val sub = "sub".asTag
  val sup = "sup".asTag
  val i = "i".asTag
  val b = "b".asTag
  val u = "u".asTag
  val span = "span".asTag
  val br = "br".asTag
  val wbr = "wbr".asTag
  // Edits
  val ins = "ins".asTag
  val del = "del".asTag
  // Embedded content
  val img = "img".asTag
  val iframe = "iframe".asTag
  val embed = "embed".asTag
  val `object` = "object".asTag
  val param = "param".asTag
  val video = "video".asTag
  val audio = "audio".asTag
  val source = "source".asTag
  val track = "track".asTag
  val canvas = "canvas".asTag
  val map = "map".asTag
  val area = "area".asTag
  // Tabular data
  val table = "table".asTag
  val caption = "caption".asTag
  val colgroup = "colgroup".asTag
  val col = "col".asTag
  val tbody = "tbody".asTag
  val thead = "thead".asTag
  val tfoot = "tfoot".asTag
  val tr = "tr".asTag
  val td = "td".asTag
  val th = "th".asTag
  // Forms
  val form = "form".asTag
  val fieldset = "fieldset".asTag
  val legend = "legend".asTag
  val label = "label".asTag
  val input = "input".asTag
  val button = "button".asTag
  val select = "select".asTag
  val datalist = "datalist".asTag
  val optgroup = "optgroup".asTag
  val option = "option".asTag
  val textarea = "textarea".asTag
}