import { Hooks, config, logger } from '../mod.ts'
import { resolve } from 'https://deno.land/std@0.170.0/path/mod.ts'

const getRegisteredHooks = async <THook extends keyof Hooks>(
    directory: string,
    hookName: THook,
): Promise<Hooks[THook][]> => {
    const hooks =
        config()
            .plugins?.flatMap((p) => p.hooks[hookName])
            .filter((hook): hook is Hooks[THook] => hook !== undefined) ?? []

    const file = resolve(`${directory}/hooks.ts`)
    try {
        const module = await import('file:///' + file)
        const hook = module[hookName]
        if (typeof hook !== 'function') {
            logger.debug(`Could not find hook ${hookName} in ${file}`)
        } else {
            hooks.push(hook)
        }
    } catch {
        logger.debug(`Could not import hook file at ${file}`)
    }

    return hooks
}

export const executeHook = async <THook extends keyof Hooks>(
    directory: string,
    hookName: THook,
    ...args: Parameters<Hooks[THook]>
): Promise<ReturnType<Hooks[THook]> | undefined> => {
    const registeredHooks = await getRegisteredHooks(directory, hookName)
    logger.debug(`Found ${registeredHooks.length} hooks for ${hookName}`)

    for (const hook of registeredHooks) {
        // deno-lint-ignore no-explicit-any
        const currentHook = hook as any // TODO: There is a bug on typescript here

        const result = await currentHook(...args)
        if (result !== undefined) {
            return result
        }
    }
}
