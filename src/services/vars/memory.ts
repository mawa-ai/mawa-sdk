import { UserId } from '../../../sdk/user.ts'

const vars: Record<string, Record<string, unknown>> = {}

const setKv = <T>(userId: UserId, key: string, value: T): Promise<void> => {
    if (!vars[userId]) {
        vars[userId] = {}
    }
    vars[userId][key] = value
    return Promise.resolve()
}

const getKv = <T>(userId: UserId, key: string): Promise<T | undefined> => {
    if (!vars[userId]) {
        return Promise.resolve(undefined)
    }
    return Promise.resolve(vars[userId][key] as T)
}

export const varsMemoryStorage = {
    setKv,
    getKv,
}
