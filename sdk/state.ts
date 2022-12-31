import { User } from './user.ts'
import { Message, MessageTypes } from './message.ts'
import { BotConfiguration } from './config.ts'

export type KnownContext<MessageType extends keyof MessageTypes> = {
    track: (event: string, properties?: Record<string, unknown>) => Promise<void>
    send: <Type extends keyof MessageTypes>(message: Message<Type> | string) => Promise<void>
    mergeUser: (user: Omit<Partial<User>, 'id'>) => Promise<void>
    setKv: (key: string, value: unknown) => Promise<void>
    getKv: (key: string) => Promise<unknown>
    message: Message<MessageType>
    author: User
    config: BotConfiguration
}

export type Context = KnownContext<keyof MessageTypes>

export type StateResult = {
    input: boolean
    next?: string
}

export type State = (context: Context) => Promise<StateResult>
