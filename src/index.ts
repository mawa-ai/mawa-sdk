import { initializeConfiguration } from './config.ts'
import { initializeGateways } from './gateways/index.ts'
import { handleMessage } from './state.ts'

const directory = Deno.args[0] || Deno.cwd()

await initializeConfiguration(directory)
await initializeGateways(async (sourceAuthorId, message, gateway) => {
    await handleMessage(sourceAuthorId, message, gateway, directory)
})
