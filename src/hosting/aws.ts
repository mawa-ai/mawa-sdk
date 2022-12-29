import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'https://deno.land/x/lambda@1.29.1/mod.ts'
import { config, initializeConfiguration } from '../config.ts'
import { resolveGateway } from '../gateways/index.ts'
import { logger, setMinimumLogLevel } from '../log.ts'
import { handleMessage } from '../state.ts'

export const getHandler = (directory: string) => {
    return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
        logger.info('Received event', event)

        await initializeConfiguration(directory, false)
        logger.debug('Configuration loaded')

        const logLevel = config().logLevel
        if (logLevel) {
            setMinimumLogLevel(logLevel)
        }

        try {
            const request = new Request(event.requestContext.http.path, {
                method: event.requestContext.http.method,
                headers: new Headers({ ...event.headers } as HeadersInit),
                body: event.body,
            })
            const response = await resolveGateway(request, (sourceAuthorId, message, gateway) =>
                handleMessage(sourceAuthorId, message, gateway, directory),
            )
            return {
                statusCode: response.status,
                headers: Object.fromEntries(response.headers),
                body: response.body ? await response.text() : undefined,
            }
        } catch (err) {
            logger.error(err)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error receiving message: ' + err.message }),
            }
        }
    }
}
