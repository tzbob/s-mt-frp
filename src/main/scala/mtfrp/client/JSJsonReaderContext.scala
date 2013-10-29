package mtfrp.client

import scala.js.exp.FFIExp
import scala.js.language.Records
import scala.js.language.JS
import scala.js.language.Casts

trait JSJsonReaderContext { self: JS with FFIExp with Casts =>

  private def browserJSONParse(raw: Rep[String]): Rep[Record] =
    foreign"JSON.parse($raw)".withEffect()

  @serializable
  trait JSJsonReader[T] {
    def read(raw: Rep[String]): Rep[T]
  }

  implicit object StringJSJsonReader extends JSJsonReader[String] {
    def read(raw: Rep[String]) = browserJSONParse(raw).as[String]
  }

  implicit object IntJSJsonReader extends JSJsonReader[Int] {
    def read(raw: Rep[String]) = browserJSONParse(raw).as[Int]
  }

}