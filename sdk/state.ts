import { User } from './user.ts'
import { Message, MessageTypes, UnknownMessage } from './message.ts'
import { BotConfiguration } from './config.ts'

export type Context = {
    send: <Type extends keyof MessageTypes>(message: Message<Type> | string) => Promise<void>
    mergeUser: (user: Omit<Partial<User>, 'id'>) => Promise<void>
    setKv: (key: string, value: unknown) => Promise<void>
    getKv: (key: string) => Promise<unknown>
    message: UnknownMessage
    author: User
    config: BotConfiguration
}

export type StateResult = {
    input?: boolean
    next?: string
}

export type State = (context: Context) => Promise<StateResult | void>
