export const executeHook = async <THook extends (...args: Parameters<THook>) => Promise<unknown>>(
    directory: string,
    hookName: string,
    ...args: Parameters<THook>
): Promise<ReturnType<THook> | undefined> => {
    const file = `${directory}/hooks.ts`
    let module
    try {
        module = await import(file)
    } catch {
        return
    }

    const hook = module[hookName]
    if (typeof hook !== 'function') {
        return
    }

    const hookReturn = await hook(...Array.from(args))
    return hookReturn
}
