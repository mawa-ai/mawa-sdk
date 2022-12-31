import { WhatsappChannelConfiguration } from '../../../sdk/config.ts'
import { isMessageOfType, MessageTypes, UnknownMessage } from '../../../sdk/message.ts'
import { config } from '../../config.ts'
import { Gateway, SourceMessage } from '../gateway.ts'
import { whatsappTextConverter } from './converters/text.ts'
import { logger } from '../../log.ts'
import { User } from '../../../sdk/user.ts'
import { mergeUser } from '../../services/user/user.ts'
import { whatsappQuickReplyConverter } from './converters/quickReply.ts'
import { whatsappMenuConverter } from './converters/menu.ts'
import { Converter } from '../converter.ts'

const converters: Converter<keyof MessageTypes>[] = [
    whatsappTextConverter,
    whatsappQuickReplyConverter,
    whatsappMenuConverter,
]

export class WhatsappGateway implements Gateway {
    public readonly sourceId = 'whatsapp'

    public async receive(request: Request): Promise<SourceMessage | Response> {
        if (request.method === 'GET') {
            const searchParams = new URL(request.url).searchParams
            const challenge = searchParams.get('hub.challenge')
            const mode = searchParams.get('hub.mode')
            const token = searchParams.get('hub.verify_token')

            if (mode === 'subscribe' && token === this.config.verifyToken) {
                return new Response(challenge!)
            } else {
                logger.debug('Received invalid request from whatsapp', {
                    mode,
                    token,
                    expectedToken: this.config.verifyToken,
                })
                return new Response('Invalid token', { status: 403 })
            }
        } else if (request.method === 'POST') {
            const body = await request.json()

            logger.debug('Received request from whatsapp', body)

            const value = body.entry[0].changes[0].value
            if (value.metadata.phone_number_id !== this.config.numberId) {
                logger.debug('Received message from another number', value)
                return new Response('Invalid message', { status: 400 })
            }

            const waMessage = value.messages?.[0]
            // Probably a status message
            if (!waMessage) {
                logger.debug('Received message without message', value)
                return new Response()
            }

            const waid = value.contacts[0].wa_id
            const name = value.contacts[0].profile.name

            const message = this.convertFromWhatsappMessage(waMessage)
            if (!message) {
                logger.debug('Could not convert received message', waMessage)
                return new Response()
            }

            const userId = User.getIdFromSourceId(waid, this.sourceId)
            await mergeUser(userId, { name, phoneNumber: waid })

            return {
                sourceAuthorId: waid,
                message,
            }
        } else {
            return new Response('Invalid method', { status: 405 })
        }
    }

    public async send(sourceUserId: string, message: UnknownMessage): Promise<void> {
        const url = `https://graph.facebook.com/v15.0/${this.config.numberId}/messages`
        const headers = new Headers({
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
        })

        const whatsappMessage = this.convertToWhatsappMessage(message) as Record<string, unknown>
        logger.info('Sending message to whatsapp', whatsappMessage)

        const result = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: sourceUserId,
                ...whatsappMessage,
            }),
        })

        if (result.status !== 200) {
            try {
                const response = await result.json()
                logger.error('Failed to send message to whatsapp: ' + result.status, response)
            } catch (err) {
                logger.error(err)
            }

            throw new Error(`Failed to send message to whatsapp: ${result.status}`)
        }
    }

    private get config(): WhatsappChannelConfiguration {
        return config().channels.whatsapp!
    }

    private convertToWhatsappMessage(message: UnknownMessage): unknown {
        for (const converter of converters) {
            if (converter.convertToSourceMessage && isMessageOfType(message, converter.type)) {
                return converter.convertToSourceMessage(message.content)
            }
        }

        throw new Error(`No converter found for message type ${message.type}`)
    }

    private convertFromWhatsappMessage(message: unknown): UnknownMessage | undefined {
        for (const converter of converters) {
            if (converter.convertFromSourceMessage && converter.isSourceConverter?.(message)) {
                return {
                    type: converter.type,
                    content: converter.convertFromSourceMessage(message),
                }
            }
        }

        return undefined
    }
}
