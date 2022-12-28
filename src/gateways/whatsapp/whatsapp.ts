import { WhatsappChannelConfiguration } from '../../../sdk/config.ts'
import { isMessageOfType, UnknownMessage } from '../../../sdk/message.ts'
import { config } from '../../config.ts'
import { Gateway, SourceMessage } from '../gateway.ts'
import { whatsappTextConverter } from './converters/text.ts'
import { getIdFromSourceId, mergeUser } from '../../services/user/user.ts'

const converters = [whatsappTextConverter]

export class WhatsappGateway implements Gateway {
    public sourceId = 'whatsapp'

    public async receive(request: Request): Promise<SourceMessage | Response> {
        if (request.method === 'GET') {
            const searchParams = new URL(request.url).searchParams
            const challenge = searchParams.get('hub.challenge')
            const mode = searchParams.get('hub.mode')
            const token = searchParams.get('hub.verify_token')

            if (mode === 'subscribe' && token === this.config.verifyToken) {
                return new Response(challenge!)
            } else {
                return new Response('Invalid token', { status: 403 })
            }
        } else if (request.method === 'POST') {
            const body = await request.json()

            const value = body.entry[0].changes[0].value
            if (value.metadata.phone_number_id !== this.config.numberId) {
                return new Response('Invalid message', { status: 400 })
            }

            const waMessage = value.messages?.[0]
            // Probably a status message
            if (!waMessage) {
                return new Response()
            }

            const waid = value.contacts[0].wa_id
            const name = value.contacts[0].profile.name

            const message = this.convertFromWhatsappMessage(waMessage)
            const userId = await getIdFromSourceId(waid, this.sourceId)
            await mergeUser(userId, { name, phoneNumber: waid })

            return {
                sourceAuthorId: waid,
                message,
            }
        } else {
            return new Response('Invalid method', { status: 405 })
        }
    }

    public async send(sourceAuthorId: string, message: UnknownMessage): Promise<void> {
        const url = `https://graph.facebook.com/v15.0/${this.config.numberId}/messages`
        const headers = new Headers({
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
        })

        const result = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: sourceAuthorId,
                ...(this.convertToWhatsappMessage(message) as Record<string, unknown>),
            }),
        })

        if (result.status !== 200) {
            try {
                const response = await result.text()
                console.error(response)
            } catch (err) {
                console.error("Couldn't parse response: ", err)
            }

            throw new Error(`Failed to send message to whatsapp: ${result.status}`)
        }
    }

    private get config(): WhatsappChannelConfiguration {
        return config().channels.whatsapp!
    }

    private convertToWhatsappMessage(message: UnknownMessage): unknown {
        for (const converter of converters) {
            if (isMessageOfType(message, converter.type)) {
                return converter.convertToSourceMessage(message.content)
            }
        }

        throw new Error(`No converter found for message type ${message.type}`)
    }

    private convertFromWhatsappMessage(message: unknown): UnknownMessage {
        for (const converter of converters) {
            if (converter.isSourceConverter(message)) {
                return {
                    type: converter.type,
                    content: converter.convertFromSourceMessage(message),
                }
            }
        }

        throw new Error(`No converter found for whatsapp message`)
    }
}
