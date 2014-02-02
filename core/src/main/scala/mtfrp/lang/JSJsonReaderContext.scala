package mtfrp.lang

import scala.js.exp.FFIExp
import scala.js.language.{ Casts, JS }
import scala.js.language.JSLib

trait JSJsonReaderContext extends JS {

  protected[mtfrp] def parse[T](raw: Rep[String]): Rep[T]

  @serializable
  trait JSJsonReader[T] {
    def read(raw: Rep[String]): Rep[T]
  }

  implicit object StringJSJsonReader extends JSJsonReader[String] {
    def read(raw: Rep[String]) = raw
  }

  implicit object IntJSJsonReader extends JSJsonReader[Int] {
    def read(raw: Rep[String]) = parse[Int](raw)
  }

  implicit object ListJSJsonReader extends JSJsonReader[List[String]] {
    def read(raw: Rep[String]) = parse[List[String]](raw)
  }

}