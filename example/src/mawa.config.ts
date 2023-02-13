import { Configuration } from '../../sdk/config.ts'
import { load } from 'https://deno.land/std@0.170.0/dotenv/mod.ts'
import { fromFileUrl } from 'https://deno.land/std@0.170.0/path/mod.ts'

await load({
    export: true,
    envPath: fromFileUrl(import.meta.resolve('./.env')),
})

const config: Configuration = {
    hosting: {
        http: {
            port: Number(Deno.env.get('PORT')),
        },
    },
    logLevel: 'WARNING',
    channels: {
        webhook: {
            url: 'http://localhost:3001',
        },
        whatsapp: {
            token: Deno.env.get('WHATSAPP_TOKEN') as string,
            numberId: Deno.env.get('WHATSAPP_NUMBER_ID') as string,
            verifyToken: Deno.env.get('WHATSAPP_VERIFY_TOKEN') as string,
        },
        web: {},
    },
    storage: {
        type: 'memory',
    },
}

export default config
