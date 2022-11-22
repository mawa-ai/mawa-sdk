import { Context, StateResult } from '../../../sdk/state.ts'

export default async function (context: Context): Promise<StateResult> {
    await context.send(`Olá, qual seu nome?`)

    return {
        input: true,
        next: 'ask-name',
    }
}
