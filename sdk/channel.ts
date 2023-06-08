import { UnknownMessage } from './message.ts'

export type MessageHandler = (channelAuthorId: string, message: UnknownMessage, channel: Channel) => Promise<void>

export type SourceMessage = {
    sourceAuthorId: string
    message: UnknownMessage
}

export interface Channel {
    readonly sourceId: string
    receive: (request: Request) => Promise<SourceMessage | Response | void>
    handle?: (request: Request, messageHandler: MessageHandler) => Promise<Response>
    send: (sourceUserId: string, message: UnknownMessage) => Promise<void>
}
