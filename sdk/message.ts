export type PlainText = string
export type Menu = {
    text: string
    button: string
    options: string[]
}

export type MessageTypes = {
    ['text']: PlainText
    ['menu']: Menu
}

export type Message<Type extends keyof MessageTypes> = {
    type: Type
    content: MessageTypes[Type]
    metadata?: Record<string, string>
}

export type UnknownMessage = Message<keyof MessageTypes>

export const isMessageOfType = <Type extends keyof MessageTypes>(
    message: UnknownMessage,
    type: Type,
): message is Message<Type> => message.type === type
