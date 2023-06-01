import { config, initializeConfiguration } from '../config.ts'
import { resolveGateway } from '../gateways/gateways.ts'
import { logger, setup } from '../log.ts'
import { handleMessage } from '../state.ts'

export const createFetchListener = async (directory: string) => {
    await initializeConfiguration(directory, false)
    const logLevel = config().logLevel
    if (logLevel) {
        setup(logLevel)
    }

    return (request: Request): Promise<Response> => {
        try {
            return resolveGateway(request, async (sourceAuthorId, message, gateway) => {
                logger.info('Received message from ' + sourceAuthorId + ' via ' + gateway.sourceId, {
                    sourceAuthorId: sourceAuthorId,
                    message,
                    gateway: gateway.sourceId,
                })

                await handleMessage(sourceAuthorId, message, gateway, directory)
            })
        } catch (err) {
            logger.error(err)
            return Promise.resolve(
                Response.json(
                    {
                        error: 'Error receiving message: ' + err.message,
                    },
                    { status: 500 },
                ),
            )
        }
    }
}
