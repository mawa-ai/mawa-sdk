import { isMessageOfType, Context, StateResult } from '../../../mod.ts'

export default async function (context: Context): Promise<StateResult> {
    if (isMessageOfType(context.message, 'text')) {
        await context.mergeUser({
            name: context.message.content,
        })
        await context.send(`Bom dia, ${context.author.name}`)
        await context.send(`Como você está hoje?`)
        return {
            input: true,
            next: 'ask-feeling',
        }
    } else {
        await context.send(`Não entendi, qual seu nome?`)
        return {
            input: true,
            next: 'ask-name',
        }
    }
}
