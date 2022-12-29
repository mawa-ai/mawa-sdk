import { isMessage, UnknownMessage } from '../../../sdk/message.ts'
import { Gateway, SourceMessage } from '../gateway.ts'
import { config } from '../../config.ts'
import { WebhookChannelConfiguration } from '../../../sdk/config.ts'

export class WebhookGateway implements Gateway {
    public readonly sourceId = 'webhook'

    public async receive(request: Request): Promise<SourceMessage | Response> {
        if (this.config.authorizationToken && request.headers.get('Authorization') !== this.config.authorizationToken) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { from: sourceAuthorId, message } = await request.json()
        if (!sourceAuthorId) {
            return new Response('Missing from', { status: 400 })
        }

        if (!isMessage(message)) {
            return new Response('Missing message', { status: 400 })
        }

        return { sourceAuthorId, message }
    }

    public async send(sourceUserId: string, message: UnknownMessage): Promise<void> {
        const headers = new Headers({
            'Content-Type': 'application/json',
        })

        if (this.config.authorizationToken) {
            headers.set('Authorization', this.config.authorizationToken)
        }

        const result = await fetch(this.config.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                to: sourceUserId,
                message: message,
            }),
        })

        if (result.status !== 200) {
            throw new Error(`Failed to send message to ${this.config.url}`)
        }
    }

    private get config(): WebhookChannelConfiguration {
        return config().channels.webhook!
    }
}
