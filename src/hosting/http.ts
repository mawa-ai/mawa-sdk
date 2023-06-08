import { MessageHandler, config, logger, setupLogger } from '../../mod.ts'
import { resolveChannel } from '../channel/channel.ts'
import { initializeConfiguration } from '../config.ts'
import { handleMessage } from '../state.ts'

const handlerHttpConnection = async (conn: Deno.Conn, onMessage: MessageHandler) => {
    const httpConn = Deno.serveHttp(conn)
    try {
        for await (const requestEvent of httpConn) {
            try {
                logger.debug('Received request', { url: requestEvent.request.url })

                const response = await resolveChannel(requestEvent.request, onMessage)
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

const initializeHttp = async (port: number, onMessage: MessageHandler) => {
    const server = Deno.listen({ port })
    logger.info(`Listening on port ${port}`)

    for await (const conn of server) {
        // In order to not be blocking, we need to handle each connection individually
        // without awaiting the function
        handlerHttpConnection(conn, onMessage)
    }
}

export const start = async (directory: string, port = 5501) => {
    await initializeConfiguration(directory, true)

    const logLevel = config().logLevel
    if (logLevel) {
        setupLogger(logLevel)
    }

    await initializeHttp(port, async (sourceAuthorId, message, channel) => {
        logger.info('Received message from ' + sourceAuthorId + ' via ' + channel.sourceId, {
            sourceAuthorId: sourceAuthorId,
            message,
            channel: channel.sourceId,
        })
        await handleMessage(sourceAuthorId, message, channel, directory)
    })
}
