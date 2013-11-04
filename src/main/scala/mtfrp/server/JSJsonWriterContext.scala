package mtfrp.server

import scala.js.exp.FFIExp
import scala.js.language.{ Casts, JS }

trait JSJsonWriterContext { self: JS with FFIExp with Casts =>

  private def browserJSONStringify(raw: Rep[Any]): Rep[String] =
    foreign"JSON.stringify($raw)".withEffect()

  @serializable
  trait JSJsonWriter[T] {
    def write(raw: Rep[T]): Rep[String]
  }

  implicit object StringJSJSonWriter extends JSJsonWriter[String] {
    def write(raw: Rep[String]): Rep[String] = browserJSONStringify(raw)
  }

  implicit object IntJSJsonWriter extends JSJsonWriter[Int] {
    def write(raw: Rep[Int]): Rep[String] = browserJSONStringify(raw)
  }

}