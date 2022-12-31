import { config, initializeConfiguration } from '../config.ts'
import { MessageHandler } from '../gateways/gateway.ts'
import { resolveGateway } from '../gateways/gateways.ts'
import { logger, setMinimumLogLevel } from '../log.ts'
import { handleMessage } from '../state.ts'

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

const initializeHttp = async (onMessage: MessageHandler) => {
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

export const start = async (directory: string) => {
    await initializeConfiguration(directory, true)
    logger.info('Configuration loaded')

    const logLevel = config().logLevel
    if (logLevel) {
        setMinimumLogLevel(logLevel)
    }

    await initializeHttp(async (sourceAuthorId, message, gateway) => {
        logger.info('Received message from ' + sourceAuthorId + ' via ' + gateway.sourceId, {
            sourceAuthorId: sourceAuthorId,
            message,
            gateway: gateway.sourceId,
        })
        await handleMessage(sourceAuthorId, message, gateway, directory)
    })
}
