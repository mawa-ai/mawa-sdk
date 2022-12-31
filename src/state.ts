import { Context, StateResult } from '../sdk/state.ts'
import { isMessageOfType, Message, UnknownMessage } from '../sdk/message.ts'
import { Gateway } from './gateways/gateway.ts'
import { getKv, setKv } from './services/vars/vars.ts'
import { getUser, mergeUser } from './services/user/user.ts'
import { executeHook } from './hooks.ts'
import { ErrorHook, EventHook, MessageHook } from '../sdk/hooks.ts'
import { config } from './config.ts'
import { logger } from './log.ts'
import { resolve } from 'https://deno.land/std@0.170.0/path/mod.ts'
import { User } from '../sdk/user.ts'

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
    const userId = User.getIdFromSourceId(sourceAuthorId, gateway.sourceId)
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
        if (isMessageOfType(message, 'event')) {
            await executeHook<EventHook>(directory, 'event', context)
        } else {
            if (iterations === 0) {
                const hookResult = await executeHook<MessageHook>(directory, 'message', context)
                if (hookResult === true) {
                    return
                }
            }

            const currentState = (await getKv<string>(user.id, '#state')) || 'start'
            logger.debug('Executing state ' + currentState + ' for user ' + user.id, {
                user,
                message,
                gateway: gateway.sourceId,
                state: currentState,
            })

            const [filename, action] = currentState.split('.')
            const file = resolve(`${directory}/flow/${filename}.ts`)
            const module = await import('file:///' + file)

            const result = await module[action || 'default'](context)
            const stateResult: StateResult = result || {}
            await setKv(user.id, '#last-state', currentState)
            await setKv(user.id, '#state', stateResult.next || 'start')

            if (!stateResult.input) {
                await handleMessage(sourceAuthorId, message, gateway, directory, iterations + 1)
            }
        }
    } catch (err) {
        logger.error(err)

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
