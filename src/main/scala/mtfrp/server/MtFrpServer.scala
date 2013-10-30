package mtfrp.server

import java.net.URLEncoder
import java.util.UUID

import mtfrp.client.MtFrpClient
import reactive.EventSource
import reactive.EventStream
import spray.json.JsonReader
import spray.json.JsonWriter
import spray.json.pimpString
import spray.routing.Directive.pimpApply
import spray.routing.Directives
import spray.routing.Route
import spray.routing.directives.CompletionMagnet.fromObject

trait MtFrpServer extends MtFrpClient with JSJsonWriterContext with ServerEventStreamLib