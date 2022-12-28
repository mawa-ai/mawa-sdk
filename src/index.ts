import { initializeConfiguration, config } from './config.ts'
import { initializeHttp } from './hosting/http.ts'
import { logger, setMinimumLogLevel } from './log.ts'
import { handleMessage } from './state.ts'

const directory = Deno.args[0] || Deno.cwd()
logger.info('Starting up in ' + directory)

await initializeConfiguration(directory, true)
logger.info('Configuration loaded')

const logLevel = config().logLevel
if (logLevel) {
    setMinimumLogLevel(logLevel)
}

await initializeHttp((sourceAuthorId, message, gateway) => handleMessage(sourceAuthorId, message, gateway, directory))
