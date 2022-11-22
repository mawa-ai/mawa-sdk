import { Context, StateResult } from './state.ts'

/**
 * A hook that is executed when a message is received.
 * @param context The context of the message.
 * @returns Return true to stop the execution of the state.
 */
export type MessageHook = (context: Context) => Promise<true | void>

/**
 * A hook that is executed when a user is created.
 * @param context The context of the user.
 * @param error The error that occurred.
 */
export type ErrorHook = (context: Context, error: Error) => Promise<StateResult | void>
