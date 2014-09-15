package mtfrp.lang

import scala.language.implicitConversions
import scala.js.language.Proxy

trait SFRPClientLib extends Proxy {
  val FRP: Rep[FRP]
  lazy val globalContext: Rep[TickContext] = FRP.global

  trait FRP {
    def constant[A](value: Rep[A]): Rep[JSBehavior[A]]
    def stream[A](context: Rep[TickContext]): Rep[JSEventSource[A]]
    def global: Rep[TickContext]
  }
  implicit def repToFRP(x: Rep[FRP]): FRP = repProxy[FRP](x)

  trait TickContext

  trait JSEvent[+A] {
    def map[B](mapping: Rep[A => B]): Rep[JSEvent[B]]
    def filter(predicate: Rep[A => Boolean]): Rep[JSEvent[A]]
    def or[B >: A](other: Rep[JSEvent[B]]): Rep[JSEvent[B]]
    def foreach(observer: Rep[A => Unit], c: Rep[TickContext]): Rep[Unit]
    def hold[B >: A](init: Rep[B]): Rep[JSBehavior[B]]
    def foldPast[B](init: B, op: Rep[((B, A)) => B]): Rep[JSBehavior[B]]
  }
  implicit def repToJSEvent[T: Manifest](x: Rep[JSEvent[T]]): JSEvent[T] =
    repProxy[JSEvent[T]](x)

  trait JSEventSource[A] extends JSEvent[A] {
    def fire(value: Rep[A]): Rep[Unit]
  }
  implicit def r2Src[A: Manifest](x: Rep[JSEventSource[A]]): JSEventSource[A] =
    repProxy[JSEventSource[A]](x)

  trait JSBehavior[+T] {
    def map[A](modifier: Rep[T => A]): Rep[JSBehavior[A]]
    def changes: Rep[JSEvent[T]]
    def combine[A, B](other: Rep[JSBehavior[A]], f: Rep[((T, A)) => B]): Rep[JSBehavior[B]]
    def combine2[A, B, C](one: Rep[JSBehavior[A]], two: Rep[JSBehavior[B]], f: Rep[((T, A, B)) => C]): Rep[JSBehavior[C]]
    def sampledBy(event: Rep[JSEvent[_]]): Rep[JSEvent[T]]
    def markExit(context: Rep[TickContext]): Rep[Ticket[T]]
  }
  implicit def repToJSBehavior[T: Manifest](x: Rep[JSBehavior[T]]): JSBehavior[T] =
    repProxy[JSBehavior[T]](x)

  trait Ticket[+A] {
    def now(): Rep[A]
  }
  implicit def repToTicket[T: Manifest](x: Rep[Ticket[T]]): Ticket[T] =
    repProxy[Ticket[T]](x)
}