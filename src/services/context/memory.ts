import { UserId } from '../../../sdk/user.ts'

const contexts: Record<string, Record<string, unknown>> = {}

const setKv = <T>(userId: UserId, key: string, value: T): Promise<void> => {
    if (!contexts[userId]) {
        contexts[userId] = {}
    }
    contexts[userId][key] = value
    return Promise.resolve()
}

const getKv = <T>(userId: UserId, key: string): Promise<T | undefined> => {
    if (!contexts[userId]) {
        return Promise.resolve(undefined)
    }
    return Promise.resolve(contexts[userId][key] as T)
}

export const contextMemoryStorage = {
    setKv,
    getKv,
}
