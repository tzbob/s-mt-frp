package mtfrp.lang

case class Client(id: String)

object ClientQuery {
  val any: Client => Boolean = _ => true
}