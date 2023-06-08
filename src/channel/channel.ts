import { MessageHandler, config, logger } from '../../mod.ts'

export const resolveChannel = async (request: Request, onMessage: MessageHandler): Promise<Response> => {
    const channelPatterns = config().channels.map((channel) => ({
        pattern: new URLPattern({ pathname: `/${channel.sourceId}` }),
        channel,
    }))

    const channel = channelPatterns.find((channel) => channel.pattern.test(request.url))?.channel
    if (!channel) {
        logger.debug('Failed to get channel for ' + request.url, { channels: config().channels.map((c) => c.sourceId) })
        throw new Error('No channel found for ' + request.url)
    }

    const sourceMessage = await channel.receive(request)
    if (sourceMessage instanceof Response) {
        return sourceMessage
    } else if (sourceMessage) {
        await onMessage(sourceMessage.sourceAuthorId, sourceMessage.message, channel)
        return new Response()
    } else if (channel.handle) {
        return await channel.handle(request, onMessage)
    } else {
        throw new Error('Channel ' + channel.sourceId + ' did not return a response')
    }
}
