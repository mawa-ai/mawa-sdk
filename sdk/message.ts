export type PlainText = string

type Option =
    | string
    | {
          title: string
          description?: string
      }

export type Section = {
    title?: string
    options: Option[]
}

export type Menu = {
    text: string
    button?: string
    sections: Section[]
}

export type QuickReply = {
    text: string
    options: string[]
}

export type Event = {
    event: string
    data: unknown
}

export interface MessageTypes {
    ['text']: PlainText
    ['menu']: Menu
    ['quick-reply']: QuickReply
    ['event']: Event
}

export type Message<Type extends keyof MessageTypes> = {
    type: Type
    content: MessageTypes[Type]
    metadata?: Record<string, string>
}

export type UnknownMessage = Message<keyof MessageTypes>

export const isMessage = (message: UnknownMessage): message is Message<keyof MessageTypes> => {
    return typeof message?.type === 'string' && typeof message.content !== 'undefined'
}

export const isMessageOfType = <Type extends keyof MessageTypes>(
    message: UnknownMessage,
    type: Type,
): message is Message<Type> => message.type === type
