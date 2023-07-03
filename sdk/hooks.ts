import { UnknownMessage } from './message.ts'
import { Context, KnownContext, StateResult } from './state.ts'

/**
 * A hook that is executed when a message is received.
 * @param context The context of the message.
 * @returns Return true to stop the execution of the state.
 */
export type UserMessageHook = (context: Context) => Promise<true | void>

/**
 * A hook that is executed when a message is sent or received.
 * @param context The context of the message.
 * @param direction The direction of the message.
 * @param message The message that was sent or received.
 */
export type MessageHook = (context: Context, direction: 'sent' | 'received', message: UnknownMessage) => Promise<void>

/**
 * A hook that is executed when a user is created.
 * @param context The context of the message which originated the error.
 * @param error The error that occurred.
 */
export type ErrorHook = (context: Context, error: Error) => Promise<StateResult | void>

/**
 * A hook that is executed when an event is received from the client.
 * @param context The context of the event.
 */
export type EventHook = (context: KnownContext<'event'>) => Promise<StateResult | void>

export type Hooks = {
    event: EventHook
    usermessage: UserMessageHook
    message: MessageHook
    error: ErrorHook
}
