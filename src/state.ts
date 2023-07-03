import { executeHook } from './hooks.ts'
import { resolve } from 'https://deno.land/std@0.170.0/path/mod.ts'
import {
    User,
    Context,
    KnownContext,
    StateResult,
    isMessageOfType,
    Message,
    UnknownMessage,
    Channel,
    config,
    logger,
} from '../mod.ts'

const sendMessage = async (
    directory: string,
    context: Context,
    sourceUserId: string,
    messageOrText: UnknownMessage | string,
    channel: Channel,
) => {
    const message =
        typeof messageOrText === 'string'
            ? ({ type: 'text', content: messageOrText } as Message<'text'>)
            : messageOrText
    await channel.send(sourceUserId, message)
    await executeHook(directory, 'message', context, 'sent', message)
}

const executeState = async (directory: string, context: Context, currentState = 'start'): Promise<StateResult> => {
    const [filename, action] = currentState.split('.')

    try {
        if (filename.startsWith('#')) {
            const plugin = config().plugins?.find((p) => p.id === filename.substring(1))
            if (plugin) {
                const state = plugin.states[action]
                if (!state) {
                    throw new Error(`State ${action} not found in plugin ${plugin.id}`)
                }

                return await state(context)
            }
        }

        const file = resolve(`${directory}/flow/${filename}.ts`)

        const module = await import('file:///' + file)
        return await module[action || 'default'](context)
    } catch (err) {
        if (currentState === 'start') {
            throw err
        }

        logger.warning(err, "Couldn't find state " + currentState + ', executing default state', {
            user: context.author.id,
        })
        const module = await import('file:///' + resolve(`${directory}/flow/start.ts`))
        return await module.default(context)
    }
}

const buildContext = (
    directory: string,
    user: User,
    message: UnknownMessage,
    channel: Channel,
    sourceAuthorId: string,
): Context => {
    const context: Context = {
        author: user,
        message,
        config: config().config ?? {},
        getKv: (k) => config().storage.getKv(user.id, k),
        setKv: (k, v) => config().storage.setKv(user.id, k, v),
        mergeUser: async (u) => {
            context.author = await config().storage.mergeUser(user.id, u)
        },
        send: (m) => sendMessage(directory, context, sourceAuthorId, m, channel),
        track: (e, p) => config().storage.track(user.id, e, p),
    }
    return context
}

export const handleMessage = async (
    sourceAuthorId: string,
    message: UnknownMessage,
    channel: Channel,
    directory: string,
    iterations = 0,
    handleEvent = true,
): Promise<void> => {
    const userId = User.getIdFromSourceId(sourceAuthorId, channel.sourceId)
    if (iterations > 10) {
        throw new Error(`Too many iterations for user '${userId}'`)
    }

    const user = (await config().storage.getUser(userId)) ?? (await config().storage.mergeUser(userId, {}))
    const context = buildContext(directory, user, message, channel, sourceAuthorId)

    try {
        if (handleEvent && isMessageOfType(message, 'event')) {
            logger.debug('Executing event hook for user ' + user.id, {
                user: user.id,
                message,
                channel: channel.sourceId,
            })

            const stateResult = await executeHook(directory, 'event', context as KnownContext<'event'>)
            if (stateResult) {
                await config().storage.setKv(user.id, '#last-state', await config().storage.getKv(user.id, '#state'))
                await config().storage.setKv(user.id, '#state', stateResult.next || null)
                if (stateResult.input === false) {
                    return await handleMessage(sourceAuthorId, message, channel, directory, iterations + 1, false)
                }
            }
        } else {
            if (iterations === 0) {
                const hookResult = await executeHook(directory, 'usermessage', context)
                await executeHook(directory, 'message', context, 'received', message)
                if (hookResult === true) {
                    return
                }
            }

            const currentState = await config().storage.getKv<string>(user.id, '#state')
            logger.debug('Executing state ' + currentState + ' for user ' + user.id, {
                user: user.id,
                message,
                channel: channel.sourceId,
                state: currentState,
            })

            const stateResult = await executeState(directory, context, currentState)
            await config().storage.setKv(user.id, '#last-state', currentState)
            await config().storage.setKv(user.id, '#state', stateResult.next)

            if (stateResult.input === false) {
                return await handleMessage(sourceAuthorId, message, channel, directory, iterations + 1, handleEvent)
            }
        }
    } catch (err) {
        logger.error(err)

        const stateResult = await executeHook(directory, 'error', context, err)
        if (stateResult) {
            await config().storage.setKv(user.id, '#last-state', await config().storage.getKv(user.id, '#state'))
            await config().storage.setKv(user.id, '#state', stateResult.next)
            if (stateResult.input === false) {
                return await handleMessage(sourceAuthorId, message, channel, directory, iterations + 1, handleEvent)
            }
        }
    }
}
