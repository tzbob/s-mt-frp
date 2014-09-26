package mtfrp.lang

import scala.virtualization.lms.common.Base

trait DelayedEval extends Base {

  def delayForClient[T: Manifest](thunk: Client => Rep[T]): Rep[T]
  def delay[T: Manifest](thunk: => Rep[T]): Rep[T] =
    delayForClient((c: Client) => thunk)

  def includeClientIdParam(url: String): Rep[String] =
    delayForClient(client => unit(url + "?id=" + client.id))

}