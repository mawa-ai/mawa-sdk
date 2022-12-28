import { MawaConfiguration } from '../../sdk/config.ts'
import 'https://deno.land/std@0.170.0/dotenv/load.ts'

const config: MawaConfiguration = {
    port: Number(Deno.env.get('PORT')),
    channels: {
        raw: {
            webhookUrl: 'http://localhost:3001',
        },
        whatsapp: {
            token: Deno.env.get('WHATSAPP_TOKEN') as string,
            numberId: Deno.env.get('WHATSAPP_NUMBER_ID') as string,
            verifyToken: Deno.env.get('WHATSAPP_VERIFY_TOKEN') as string,
        },
    },
    storage: {
        type: 'memory',
    },
}

export default config
