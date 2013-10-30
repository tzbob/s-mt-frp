package mtfrp.server

import mtfrp.client.MtFrpClient

trait MtFrpServer extends MtFrpClient with JSJsonWriterContext with ServerEventStreamLib