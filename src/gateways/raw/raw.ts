import { UnknownMessage } from '../../../sdk/message.ts'
import { Gateway, SourceMessage } from '../gateway.ts'
import { config } from '../../config.ts'
import { RawChannelConfiguration } from '../../../sdk/config.ts'

export class RawGateway implements Gateway {
    public sourceId = 'raw'

    public async receive(request: Request): Promise<SourceMessage> {
        const { from: sourceAuthorId, message } = await request.json()
        return { sourceAuthorId, message }
    }

    public async send(sourceAuthorId: string, message: UnknownMessage): Promise<void> {
        const headers = new Headers({
            'Content-Type': 'application/json',
        })

        if (this.config.authorizationToken) {
            headers.set('Authorization', this.config.authorizationToken)
        }

        const result = await fetch(this.config.webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                to: sourceAuthorId,
                message: message,
            }),
        })

        if (result.status !== 200) {
            throw new Error(`Failed to send message to ${this.config.webhookUrl}`)
        }
    }

    private get config(): RawChannelConfiguration {
        return config().channels.raw!
    }
}
