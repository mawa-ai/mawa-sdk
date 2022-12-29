import { ChannelsConfiguration } from '../../sdk/config.ts'
import { config } from '../config.ts'
import { Gateway, MessageHandler } from './gateway.ts'
import { WebGateway } from './web/web.ts'
import { WebhookGateway } from './webhook/webhook.ts'
import { WhatsappGateway } from './whatsapp/whatsapp.ts'

const gateways: Gateway[] = [new WhatsappGateway(), new WebhookGateway(), new WebGateway()]

export const addGateway = (gateway: Gateway) => {
    gateways.push(gateway)
}

export const resolveGateway = async (request: Request, onMessage: MessageHandler): Promise<Response> => {
    const gatewayPatterns = gateways.map((gateway) => ({
        pattern: new URLPattern({ pathname: `/${gateway.sourceId}` }),
        gateway,
    }))

    const gateway = gatewayPatterns.find((gateway) => gateway.pattern.test(request.url))?.gateway
    if (!gateway || !config().channels[gateway.sourceId as keyof ChannelsConfiguration]) {
        throw new Error('No gateway found for ' + request.url)
    }

    const sourceMessage = await gateway.receive(request)
    if (sourceMessage instanceof Response) {
        return sourceMessage
    } else if (sourceMessage) {
        await onMessage(sourceMessage.sourceAuthorId, sourceMessage.message, gateway)
        return new Response()
    } else if (gateway.handle) {
        return await gateway.handle(request, onMessage)
    } else {
        throw new Error('Gateway ' + gateway.sourceId + ' did not return a response')
    }
}
