import { MessageTypes } from '../../sdk/message.ts'

export interface Converter<Type extends keyof MessageTypes> {
    type: Type
    isSourceConverter: (sourceMessage: unknown) => boolean
    convertFromSourceMessage(sourceMessage: unknown): MessageTypes[Type]
    convertToSourceMessage(content: MessageTypes[Type]): unknown
}
