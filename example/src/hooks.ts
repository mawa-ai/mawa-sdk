import { MessageHook, Context } from '../../mod.ts'

export const message: MessageHook = (context: Context) => {
    console.log('New message:', context.message.content)
    return Promise.resolve()
}
