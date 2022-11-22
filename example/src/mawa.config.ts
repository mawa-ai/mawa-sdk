import { MawaConfiguration } from '../../sdk/config.ts'

const config: MawaConfiguration = {
    port: Number(Deno.env.get('PORT')) || 3000,
    channels: {
        raw: {
            webhookUrl: 'http://localhost:3001',
        },
    },
}

export default config
