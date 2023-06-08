import { logger } from './mod.ts'
import { start } from './src/hosting/http.ts'

const directory = Deno.args[0] || Deno.cwd()
logger.info('Starting up in ' + directory)

await start(directory)
