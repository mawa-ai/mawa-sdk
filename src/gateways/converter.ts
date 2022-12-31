import { MessageTypes } from '../../sdk/message.ts'

export interface Converter<Type extends keyof MessageTypes> {
    type: Type
    // deno-lint-ignore no-explicit-any
    isSourceConverter?: (sourceMessage: any) => boolean
    // deno-lint-ignore no-explicit-any
    convertFromSourceMessage?(sourceMessage: any): MessageTypes[Type]
    convertToSourceMessage?(content: MessageTypes[Type]): unknown
}
