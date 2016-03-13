package mtfrp.lang

import scala.js.exp.FFIExp
import scala.js.language.Adts

trait JSJsonReaderLib extends Adts with FFIExp {

  def parse[T: Manifest](raw: Rep[String]): Rep[T]

  implicit class ConvertRepString(x: Rep[String]) {
    def convertToRep[T: JSJsonReader] = implicitly[JSJsonReader[T]].read(x)
  }

  trait JSJsonReader[T] extends Serializable {
    def read(raw: Rep[String]): Rep[T]
  }

  implicit object StringJSJsonReader extends JSJsonReader[String] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit object IntJSJsonReader extends JSJsonReader[Int] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit object BooleanJSJsonReader extends JSJsonReader[Boolean] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def adtJSJsonReader[A <: Adt] = new JSJsonReader[A] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def listJSJsonReader[T: JSJsonReader] = new JSJsonReader[List[T]] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def seqJSJsonReader[T: JSJsonReader] = new JSJsonReader[Seq[T]] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def arrayJSJsonReader[T: JSJsonReader] = new JSJsonReader[Array[T]] {
    def read(raw: Rep[String]) = parse(raw)
  }

  implicit def tupleJSJsonReader[A: JSJsonReader, B: JSJsonReader] = new JSJsonReader[(A, B)] {
    def read(raw: Rep[String]) = {
      val list = parse(raw)
      foreign"""{ '_1': $list[0], '_2': $list[1] }""".withEffect()
    }
  }
}

trait JSJsonWriterLib extends Adts {

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

  implicit object BooleanJSJsonWriter extends JSJsonWriter[Boolean] {
    def write(raw: Rep[Boolean]): Rep[String] = stringify(raw)
  }

  implicit def adtJSJsonWriter[A <: Adt] = new JSJsonWriter[A] {
    def write(raw: Rep[A]): Rep[String] = stringify(raw)
  }

  implicit def listJSJsonWriter[T: JSJsonWriter] = new JSJsonWriter[List[T]] {
    def write(raw: Rep[List[T]]): Rep[String] = stringify(raw)
  }

  implicit def seqJSJsonWriter[T: JSJsonWriter] = new JSJsonWriter[Seq[T]] {
    def write(raw: Rep[Seq[T]]): Rep[String] = stringify(raw)
  }

  implicit def arrayJSJsonWriter[T: JSJsonWriter] = new JSJsonWriter[Array[T]] {
    def write(raw: Rep[Array[T]]): Rep[String] = stringify(raw)
  }
}

trait JSJsonFormatLib extends JSJsonReaderLib with JSJsonWriterLib {
  trait JSJsonFormat[T] extends JSJsonReader[T] with JSJsonWriter[T]
}
