const contexts: Record<string, Record<string, unknown>> = {}

export const setKv = <T>(userId: string, key: string, value: T): Promise<void> => {
    if (!contexts[userId]) {
        contexts[userId] = {}
    }
    contexts[userId][key] = value
    return Promise.resolve()
}

export const getKv = <T>(userId: string, key: string): Promise<T | undefined> => {
    if (!contexts[userId]) {
        return Promise.resolve(undefined)
    }
    return Promise.resolve(contexts[userId][key] as T)
}
