import { Context, UserMessageHook } from '../../mod.ts'

export const message: UserMessageHook = (context: Context) => {
    console.log('New message:', context.message.content)
    return Promise.resolve()
}
