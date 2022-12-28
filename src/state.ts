import { Context, StateResult } from '../sdk/state.ts'
import { Message, UnknownMessage } from '../sdk/message.ts'
import { Gateway } from './gateways/gateway.ts'
import { getKv, setKv } from './services/context/context.ts'
import { getIdFromSourceId, getUser, mergeUser } from './services/user/user.ts'
import { executeHook } from './hooks.ts'
import { ErrorHook, MessageHook } from '../sdk/hooks.ts'
import { config } from './config.ts'

const sendMessage = async (sourceUserId: string, messageOrText: UnknownMessage | string, gateway: Gateway) => {
    const message =
        typeof messageOrText === 'string'
            ? ({ type: 'text', content: messageOrText } as Message<'text'>)
            : messageOrText
    await gateway.send(sourceUserId, message)
}

export const handleMessage = async (
    sourceAuthorId: string,
    message: UnknownMessage,
    gateway: Gateway,
    directory: string,
    iterations = 0,
) => {
    const userId = getIdFromSourceId(sourceAuthorId, gateway.sourceId)
    if (iterations > 10) {
        throw new Error(`Too many iterations for user '${userId}'`)
    }

    const user = (await getUser(userId)) || (await mergeUser(userId, {}))

    const context: Context = {
        author: user,
        message,
        config: config().config || {},
        getKv: (k) => getKv(user.id, k),
        setKv: (k, v) => setKv(user.id, k, v),
        mergeUser: async (u) => {
            context.author = await mergeUser(user.id, u)
        },
        send: (m) => sendMessage(sourceAuthorId, m, gateway),
    }

    try {
        const hookResult = await executeHook<MessageHook>(directory, 'message', context)
        if (hookResult === true) {
            return
        }

        const currentState = (await getKv<string>(user.id, '#state')) || 'start'
        const file = `${directory}/flow/${currentState}.ts`
        const module = await import('file:///' + file)

        const result = await module.default(context)
        const stateResult: StateResult = result || {}
        await setKv(user.id, '#last-state', currentState)
        await setKv(user.id, '#state', stateResult.next || 'default')

        if (!stateResult.input) {
            await handleMessage(sourceAuthorId, message, gateway, directory, iterations + 1)
        }
    } catch (err) {
        console.error('Error handling message:', err)
        const stateResult = await executeHook<ErrorHook>(directory, 'error', context, err)
        if (stateResult) {
            await setKv(user.id, '#last-state', await getKv(user.id, '#state'))
            await setKv(user.id, '#state', stateResult.next || 'default')
            if (!stateResult.input) {
                await handleMessage(sourceAuthorId, message, gateway, directory, iterations + 1)
            }
        }
    }
}
