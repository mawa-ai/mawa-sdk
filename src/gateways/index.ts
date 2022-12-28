import { ChannelsConfiguration } from '../../sdk/config.ts'
import { UnknownMessage } from '../../sdk/message.ts'
import { config } from '../config.ts'
import { logger } from '../log.ts'
import { Gateway } from './gateway.ts'
import { RawGateway } from './raw/raw.ts'
import { WhatsappGateway } from './whatsapp/whatsapp.ts'

type MessageHandler = (gatewayAuthorId: string, message: UnknownMessage, gateway: Gateway) => Promise<void>

const gateways = [new WhatsappGateway(), new RawGateway()]
const gatewayPatterns = gateways.map((gateway) => ({
    pattern: new URLPattern({ pathname: '/' + gateway.sourceId }),
    gateway,
}))

const resolveGateway = async (request: Request, onMessage: MessageHandler): Promise<Response> => {
    const gateway = gatewayPatterns.find((gateway) => gateway.pattern.test(request.url))?.gateway
    if (!gateway || !config().channels[gateway.sourceId as keyof ChannelsConfiguration]) {
        throw new Error('No gateway found for ' + request.url)
    }

    const sourceMessage = await gateway.receive(request)
    if (sourceMessage instanceof Response) {
        return sourceMessage
    } else {
        await onMessage(sourceMessage.sourceAuthorId, sourceMessage.message, gateway)
        return new Response()
    }
}

const handlerHttpConnection = async (conn: Deno.Conn, onMessage: MessageHandler) => {
    const httpConn = Deno.serveHttp(conn)
    for await (const requestEvent of httpConn) {
        try {
            requestEvent.respondWith(await resolveGateway(requestEvent.request, onMessage))
        } catch (err) {
            logger.error('Error receiving message', err)
            requestEvent.respondWith(
                Response.json({ error: 'Error receiving message: ' + err.message }, { status: 500 }),
            )
        }
    }
}

export const initializeGateways = async (onMessage: MessageHandler) => {
    const server = Deno.listen({ port: config().port })
    logger.info(`Listening on port ${config().port}`)

    for await (const conn of server) {
        // In order to not be blocking, we need to handle each connection individually
        // without awaiting the function
        handlerHttpConnection(conn, onMessage)
    }
}
