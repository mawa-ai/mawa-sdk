import { Context, KnownContext, StateResult } from '../sdk/state.ts'
import { isMessageOfType, Message, UnknownMessage } from '../sdk/message.ts'
import { Gateway } from './gateways/gateway.ts'
import { getKv, setKv } from './services/vars/vars.ts'
import { track } from './services/track/track.ts'
import { getUser, mergeUser } from './services/user/user.ts'
import { executeHook } from './hooks.ts'
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

const executeState = async (directory: string, context: Context, currentState = 'start'): Promise<StateResult> => {
    const [filename, action] = currentState.split('.')
    const file = resolve(`${directory}/flow/${filename}.ts`)

    try {
        const module = await import('file:///' + file)
        const result = await module[action || 'default'](context)
        return result
    } catch (err) {
        if (currentState === 'start') {
            throw err
        }

        logger.warning(err, "Couldn't find state " + currentState + ' in file ' + file + ', executing default state', {
            user: context.author.id,
        })
        const module = await import('file:///' + resolve(`${directory}/flow/start.ts`))
        const result = await module.default(context)
        return result
    }
}

export const handleMessage = async (
    sourceAuthorId: string,
    message: UnknownMessage,
    gateway: Gateway,
    directory: string,
    iterations = 0,
    handleEvent = true,
): Promise<void> => {
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
        track: (e, p) => track(user.id, e, p),
    }

    try {
        if (handleEvent && isMessageOfType(message, 'event')) {
            logger.debug('Executing event hook for user ' + user.id, {
                user: user.id,
                message,
                gateway: gateway.sourceId,
            })

            const stateResult = await executeHook(directory, 'event', context as KnownContext<'event'>)
            if (stateResult) {
                await setKv(user.id, '#last-state', await getKv(user.id, '#state'))
                await setKv(user.id, '#state', stateResult.next || null)
                if (stateResult.input === false) {
                    return await handleMessage(sourceAuthorId, message, gateway, directory, iterations + 1, false)
                }
            }
        } else {
            if (iterations === 0) {
                const hookResult = await executeHook(directory, 'message', context)
                if (hookResult === true) {
                    return
                }
            }

            const currentState = await getKv<string>(user.id, '#state')
            logger.debug('Executing state ' + currentState + ' for user ' + user.id, {
                user: user.id,
                message,
                gateway: gateway.sourceId,
                state: currentState,
            })

            const stateResult = await executeState(directory, context, currentState)
            await setKv(user.id, '#last-state', currentState)
            await setKv(user.id, '#state', stateResult.next)

            if (stateResult.input === false) {
                return await handleMessage(sourceAuthorId, message, gateway, directory, iterations + 1, handleEvent)
            }
        }
    } catch (err) {
        logger.error(err)

        const stateResult = await executeHook(directory, 'error', context, err)
        if (stateResult) {
            await setKv(user.id, '#last-state', await getKv(user.id, '#state'))
            await setKv(user.id, '#state', stateResult.next)
            if (stateResult.input === false) {
                return await handleMessage(sourceAuthorId, message, gateway, directory, iterations + 1, handleEvent)
            }
        }
    }
}
