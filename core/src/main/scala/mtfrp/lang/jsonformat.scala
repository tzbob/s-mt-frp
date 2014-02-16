package mtfrp.lang

import scala.js.language.JS
import scala.js.language.Adts

trait JSJsonReaderLib extends JS with Adts {

  def parse[T: Manifest](raw: Rep[String]): Rep[T]

  trait JSJsonReader[T] extends Serializable {
    def read(raw: Rep[String]): Rep[T]
  }

  implicit object StringJSJsonReader extends JSJsonReader[String] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit object IntJSJsonReader extends JSJsonReader[Int] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit object ListJSJsonReader extends JSJsonReader[List[String]] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def adtJSJsonReader[A <: Adt] = new JSJsonReader[A] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def listJSJsonReader[T: JSJsonReader] = new JSJsonReader[List[T]] {
    def read(raw: Rep[String]) = parse(raw)
  }
}

trait JSJsonWriterLib extends JS with Adts {

  def stringify[T](raw: Rep[T]): Rep[String]

  implicit class ToJsonRep[T: JSJsonWriter](x: Rep[T]) {
    def toJSONString: Rep[String] = implicitly[JSJsonWriter[T]].write(x)
  }

  trait JSJsonWriter[T] extends Serializable {
    def write(raw: Rep[T]): Rep[String]
  }

  implicit object StringJSJSonWriter extends JSJsonWriter[String] {
    def write(raw: Rep[String]): Rep[String] = stringify(raw)
  }

  implicit object IntJSJsonWriter extends JSJsonWriter[Int] {
    def write(raw: Rep[Int]): Rep[String] = stringify(raw)
  }

  implicit def adtJSJsonWriter[A <: Adt] = new JSJsonWriter[A] {
    def write(raw: Rep[A]): Rep[String] = stringify(raw)
  }

  implicit def listJSJsonWriter[T: JSJsonWriter] = new JSJsonWriter[List[T]] {
    def write(raw: Rep[List[T]]): Rep[String] = stringify(raw)
  }

}

trait JSJsonFormatLib extends JSJsonReaderLib with JSJsonWriterLib {
  trait JSJsonFormat[T] extends JSJsonReader[T] with JSJsonWriter[T]
}