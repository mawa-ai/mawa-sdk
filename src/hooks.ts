import { logger } from './log.ts'

export const executeHook = async <THook extends (...args: Parameters<THook>) => Promise<unknown>>(
    directory: string,
    hookName: string,
    ...args: Parameters<THook>
): Promise<ReturnType<THook> | undefined> => {
    const file = `${directory}/hooks.ts`
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
