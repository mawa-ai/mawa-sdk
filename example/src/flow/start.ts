import { Context, StateResult } from '../../../mod.ts'

export default async function (context: Context): Promise<StateResult> {
    await context.send(`Olá, qual seu nome?`)

    return {
        input: true,
        next: 'start.output',
    }
}

export const output = async (context: Context): Promise<StateResult> => {
    if (context.message.content === 'tchau') {
        await context.send(`Tchau!`)
        return { input: true }
    }

    return {
        input: false,
        next: 'ask-name',
    }
}
