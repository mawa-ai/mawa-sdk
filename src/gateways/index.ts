import { ChannelsConfiguration } from '../../sdk/config.ts'
import { UnknownMessage } from '../../sdk/message.ts'
import { config } from '../config.ts'
import { logger } from '../log.ts'
import { Gateway } from './gateway.ts'
import { RawGateway } from './raw/raw.ts'
import { WhatsappGateway } from './whatsapp/whatsapp.ts'

export type MessageHandler = (gatewayAuthorId: string, message: UnknownMessage, gateway: Gateway) => Promise<void>

const gateways = [new WhatsappGateway(), new RawGateway()]
const gatewayPatterns = gateways.map((gateway) => ({
    pattern: new URLPattern({ pathname: '/' + gateway.sourceId }),
    gateway,
}))

export const resolveGateway = async (request: Request, onMessage: MessageHandler): Promise<Response> => {
    const gateway = gatewayPatterns.find((gateway) => gateway.pattern.test(request.url))?.gateway
    if (!gateway || !config().channels[gateway.sourceId as keyof ChannelsConfiguration]) {
        throw new Error('No gateway found for ' + request.url)
    }

    const sourceMessage = await gateway.receive(request)
    if (sourceMessage instanceof Response) {
        return sourceMessage
    } else {
        logger.info('Received message from ' + sourceMessage.sourceAuthorId + ' via ' + gateway.sourceId, {
            sourceAuthorId: sourceMessage.sourceAuthorId,
            message: sourceMessage.message,
            gateway: gateway.sourceId,
        })

        await onMessage(sourceMessage.sourceAuthorId, sourceMessage.message, gateway)
        return new Response()
    }
}
