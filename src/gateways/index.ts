import { ChannelsConfiguration } from '../../sdk/config.ts'
import { UnknownMessage } from '../../sdk/message.ts'
import { config } from '../config.ts'
import { Gateway } from './gateway.ts'
import { RawGateway } from './raw.ts'
import { WhatsappGateway } from './whatsapp.ts'

type MessageHandler = (gatewayAuthorId: string, message: UnknownMessage, gateway: Gateway) => Promise<void>

const gateways = [new WhatsappGateway(), new RawGateway()]
const gatewayPatterns = gateways.map((gateway) => ({
    pattern: new URLPattern({ pathname: '/' + gateway.sourceId }),
    gateway,
}))

const resolveGateway = async (request: Request, onMessage: MessageHandler) => {
    const gateway = gatewayPatterns.find((gateway) => gateway.pattern.test(request.url))?.gateway
    if (!gateway || !config().channels[gateway.sourceId as keyof ChannelsConfiguration]) {
        console.log('No gateway found for', request.url)
        return
    }

    const gatewayResolution = await gateway.receive(request)
    await onMessage(gatewayResolution.sourceAuthorId, gatewayResolution.message, gateway)
}

const handlerHttpConnection = async (conn: Deno.Conn, onMessage: MessageHandler) => {
    const httpConn = Deno.serveHttp(conn)
    for await (const requestEvent of httpConn) {
        try {
            await resolveGateway(requestEvent.request, onMessage)
            requestEvent.respondWith(new Response())
        } catch (err) {
            console.error('Error receiving message', err)
            requestEvent.respondWith(Response.json({ error: 'Error receiving message: ' + err.message }, { status: 500 }))
        }
    }
}

export const initializeGateways = async (onMessage: MessageHandler) => {
    const server = Deno.listen({ port: config().port })
    console.log(`Listening on port ${config().port}`)
    for await (const conn of server) {
        // In order to not be blocking, we need to handle each connection individually
        // without awaiting the function
        handlerHttpConnection(conn, onMessage)
    }
}
