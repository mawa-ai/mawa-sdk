import { Context, StateResult } from '../../../sdk/state.ts'

export default async function (context: Context): Promise<StateResult> {
    await context.send(`Legal! Você está: ${context.message.content}`)
    return { input: true, next: 'start' }
}
