package mtfrp.lang

import scala.js.exp.FFIExp
import scala.js.language.{ Casts, JS }
import scala.js.language.JSLib

trait JSJsonWriterContext extends JS {

  protected[mtfrp] def stringify[T](raw: Rep[T]): Rep[String]

  implicit class ToJsonRep[T: JSJsonWriter](x: Rep[T]) {
    def toJSONString: Rep[String] = implicitly[JSJsonWriter[T]].write(x)
  }

  @serializable
  trait JSJsonWriter[T] {
    def write(raw: Rep[T]): Rep[String]
  }

  implicit object StringJSJSonWriter extends JSJsonWriter[String] {
    def write(raw: Rep[String]): Rep[String] = raw
  }

  implicit object IntJSJsonWriter extends JSJsonWriter[Int] {
    def write(raw: Rep[Int]): Rep[String] = stringify(raw)
  }

}