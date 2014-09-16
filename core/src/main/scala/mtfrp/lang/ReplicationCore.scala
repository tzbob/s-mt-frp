package mtfrp.lang

import spray.routing.Route
import spray.routing.Directives._
import java.net.URLEncoder
import java.util.UUID
import frp.core.TickContext.globalTickContext
import spray.json._

trait ReplicationCoreLib extends JSJsonFormatLib with EventSources
    with SFRPClientLib with XMLHttpRequests with DelayedEval {

  object Message extends DefaultJsonProtocol {
    implicit val messageFormat = jsonFormat2(Message.apply)
  }
  case class Message(name: String, json: String) extends Adt
  val MessageRep = adt[Message]

  object ReplicationCore {
    def apply(routes: Set[Route] = Set.empty, deps: Set[ToServerDependency[_]] = Set.empty) =
      new ReplicationCore(deps, routes)
  }

  class ReplicationCore(val toServerDeps: Set[ToServerDependency[_]], val routes: Set[Route]) {
    def combine(others: ReplicationCore*): ReplicationCore = {
      def fold[T](v: ReplicationCore => Set[T]) = others.foldLeft(v(this))(_ ++ v(_))
      val routes = fold(_.routes)
      val toServerDeps = fold(_.toServerDeps)
      ReplicationCore(routes, toServerDeps)
    }

    def addToServerDependencies(deps: ToServerDependency[_]*): ReplicationCore =
      ReplicationCore(routes, toServerDeps ++ deps)

    def addRoutes(r: Route*): ReplicationCore =
      ReplicationCore(routes ++ r, toServerDeps)

    def route: Option[Route] = {
      val r1 = routes.reduceOption { _ ~ _ }
      val r2 = initializeToServerDependencies
      if (r1.isDefined)
        if (r2.isDefined) Some(r1.get ~ r2.get)
        else Some(r1.get)
      else None
    }

    /**
     *  Initializes all dependencies for ToServer calls to work
     *
     *  @return optionally the Route that encompasses all involved server
     *  functionality
     *
     */
    def initializeToServerDependencies: Option[Route] =
      if (!toServerDeps.isEmpty) {
        val genUrl = URLEncoder.encode(UUID.randomUUID.toString, "UTF-8")
        initClientSideToServer(genUrl, toServerDeps)
        Some(initServerSideToServer(genUrl, toServerDeps))
      } else None
  }

  private def initClientSideToServer(
    genUrl: String, toServerDeps: Set[ToServerDependency[_]]): Unit = {
    // create one exit point for all involved JSEvents
    val messageCarriers = toServerDeps.map(_.messageCarrier)
    val clientExitPoint: Rep[JSEvent[Seq[Message]]] =
      FRP.merge(List(messageCarriers.toSeq: _*))

    clientExitPoint.foreach(fun { (value: Rep[Seq[Message]]) =>
      val req = XMLHttpRequest()
      req.open("POST", includeClientIdParam(genUrl))
      req.send(value.toJSONString)
    }, globalContext)
  }

  private def initServerSideToServer(
    genUrl: String, toServerDeps: Set[ToServerDependency[_]]): Route = {

    val source = frp.core.EventSource.concerning[Any]
    val namedToServerDeps = toServerDeps.groupBy(_.name)
    path(genUrl) {
      parameter('id) { id =>
        post {
          entity(as[String]) { data =>
            complete {
              val messages = data.parseJson.convertTo[Seq[Message]]
              globalTickContext.withBatch { batch =>
                messages.foreach { message =>
                  namedToServerDeps(message.name).foreach {
                    _.fireIntoServerFRP(message.json, id, batch)
                  }
                }
              }
              "OK"
            }
          }
        }
      }
    }
  }

  class ToServerDependency[T: JsonReader: JSJsonWriter: Manifest](
      clientEvent: Rep[JSEvent[T]],
      serverEventSource: frp.core.EventSource[(Client, T)]) {

    val name = UUID.randomUUID.toString
    def messageCarrier: Rep[JSEvent[Message]] =
      makeLambda(clientEvent, name)

    def fireIntoServerFRP(json: String, id: String, batch: frp.core.Batch): Unit = {
      val newValue = Client(id) -> json.parseJson.convertTo[T]
      serverEventSource.batchFire(newValue)(batch)
    }
  }

  private def makeLambda[T: JSJsonWriter: Manifest](evt: Rep[JSEvent[T]], name: String) =
    evt.map(fun { t => MessageRep(name, t.toJSONString) })
}