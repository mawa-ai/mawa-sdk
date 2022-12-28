import { initializeConfiguration } from './config.ts'
import { initializeGateways } from './gateways/index.ts'
import { logger } from './log.ts'
import { handleMessage } from './state.ts'

const directory = Deno.args[0] || Deno.cwd()
logger.info('Starting up in ' + directory)

await initializeConfiguration(directory)
logger.info('Configuration loaded')

await initializeGateways(async (sourceAuthorId, message, gateway) => {
    logger.info('Received message from ' + sourceAuthorId + ' via ' + gateway.sourceId, {
        sourceAuthorId,
        message,
        gateway: gateway.sourceId,
    })

    await handleMessage(sourceAuthorId, message, gateway, directory)
})
