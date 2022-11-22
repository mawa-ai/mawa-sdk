import { UnknownMessage } from '../../sdk/message.ts'

export type SourceMessage = {
    sourceAuthorId: string
    message: UnknownMessage
}

export interface Gateway {
    sourceId: string
    receive: (request: Request) => Promise<SourceMessage>
    send: (sourceAuthorId: string, message: UnknownMessage) => Promise<void>
}
