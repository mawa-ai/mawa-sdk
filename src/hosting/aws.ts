import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'https://deno.land/x/lambda@1.29.1/mod.ts'
import { config, initializeConfiguration } from '../config.ts'
import { resolveGateway } from '../gateways/gateways.ts'
import { logger, setMinimumLogLevel } from '../log.ts'
import { handleMessage } from '../state.ts'

export const getHandler = async (
    directory: string,
    requestTransformer: (request: Request) => Request = (request) => request,
) => {
    await initializeConfiguration(directory, false)
    const logLevel = config().logLevel
    if (logLevel) {
        setMinimumLogLevel(logLevel)
    }

    return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
        logger.info('Received event', event)

        try {
            const request = new Request(
                `https://${event.requestContext.domainName}${event.rawPath}?${event.rawQueryString}`,
                {
                    method: event.requestContext.http.method,
                    headers: new Headers({ ...event.headers } as HeadersInit),
                    body: event.body,
                },
            )
            const response = await resolveGateway(
                requestTransformer(request),
                async (sourceAuthorId, message, gateway) => {
                    logger.info('Received message from ' + sourceAuthorId + ' via ' + gateway.sourceId, {
                        sourceAuthorId: sourceAuthorId,
                        message,
                        gateway: gateway.sourceId,
                    })

                    await handleMessage(sourceAuthorId, message, gateway, directory)
                },
            )
            return {
                statusCode: response.status,
                headers: Object.fromEntries(response.headers.entries()),
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
