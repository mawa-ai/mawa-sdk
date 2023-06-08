import { Configuration } from '../../mod.ts'
import { load } from 'https://deno.land/std@0.170.0/dotenv/mod.ts'
import { fromFileUrl } from 'https://deno.land/std@0.170.0/path/mod.ts'
import { MemoryStorage } from '../../src/storage/memory.ts'
import { WebhookChannel } from '../../src/channel/webhook.ts'

await load({
    export: true,
    envPath: fromFileUrl(import.meta.resolve('./.env')),
})

const config: Configuration = {
    logLevel: 'WARNING',
    channels: [new WebhookChannel({ url: 'http://localhost:3001' })],
    storage: new MemoryStorage(),
}

export default config
