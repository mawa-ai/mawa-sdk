import { config } from '../config.ts'
import { MessageHandler } from '../gateways/gateway.ts'
import { resolveGateway } from '../gateways/gateways.ts'
import { logger } from '../log.ts'

const handlerHttpConnection = async (conn: Deno.Conn, onMessage: MessageHandler) => {
    const httpConn = Deno.serveHttp(conn)
    try {
        for await (const requestEvent of httpConn) {
            try {
                const response = await resolveGateway(requestEvent.request, onMessage)
                await requestEvent.respondWith(response)
            } catch (err) {
                logger.error(err)
                await requestEvent.respondWith(
                    Response.json({ error: 'Error receiving message: ' + err.message }, { status: 500 }),
                )
            }
        }
    } catch (err) {
        logger.error(err, 'Error handling connection')
    }
}

export const initializeHttp = async (onMessage: MessageHandler) => {
    const port = config().port
    if (!port) {
        throw new Error('Port not defined')
    }

    const server = Deno.listen({ port })
    logger.info(`Listening on port ${port}`)

    for await (const conn of server) {
        // In order to not be blocking, we need to handle each connection individually
        // without awaiting the function
        handlerHttpConnection(conn, onMessage)
    }
}
