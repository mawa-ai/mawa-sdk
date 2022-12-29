import { UnknownMessage } from '../../sdk/message.ts'

export type MessageHandler = (gatewayAuthorId: string, message: UnknownMessage, gateway: Gateway) => Promise<void>

export type SourceMessage = {
    sourceAuthorId: string
    message: UnknownMessage
}

export interface Gateway {
    readonly sourceId: string
    receive: (request: Request) => Promise<SourceMessage | Response | void>
    handle?: (request: Request, messageHandler: MessageHandler) => Promise<Response>
    send: (sourceUserId: string, message: UnknownMessage) => Promise<void>
}
