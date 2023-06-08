import { Hooks, logger } from '../mod.ts'
import { resolve } from 'https://deno.land/std@0.170.0/path/mod.ts'

export const executeHook = async <THook extends keyof Hooks>(
    directory: string,
    hookName: THook,
    ...args: Parameters<Hooks[THook]>
): Promise<ReturnType<Hooks[THook]> | undefined> => {
    const file = resolve(`${directory}/hooks.ts`)
    let module
    try {
        module = await import('file:///' + file)
    } catch {
        logger.debug('Could not import hook file at ' + file)
        return
    }

    const hook = module[hookName]
    if (typeof hook !== 'function') {
        logger.debug('Could not find hook ' + hookName + ' in ' + file)
        return
    }

    logger.debug('Executing hook ' + hookName + ' in ' + file)

    const hookReturn = await hook(...Array.from(args))
    return hookReturn
}
