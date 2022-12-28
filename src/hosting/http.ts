import { config } from '../config.ts'
import { MessageHandler, resolveGateway } from '../gateways/index.ts'
import { logger } from '../log.ts'

const handlerHttpConnection = async (conn: Deno.Conn, onMessage: MessageHandler) => {
    const httpConn = Deno.serveHttp(conn)
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
}

export const initializeHttp = async (onMessage: MessageHandler) => {
    const server = Deno.listen({ port: config().port })
    logger.info(`Listening on port ${config().port}`)

    for await (const conn of server) {
        // In order to not be blocking, we need to handle each connection individually
        // without awaiting the function
        handlerHttpConnection(conn, onMessage)
    }
}
