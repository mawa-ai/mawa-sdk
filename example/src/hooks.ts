import { MessageHook } from '../../sdk/hooks.ts'
import { Context } from '../../sdk/state.ts'

export const message: MessageHook = (context: Context) => {
    console.log('New message:', context.message.content)
    return Promise.resolve()
}
