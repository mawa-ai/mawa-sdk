import { UserId } from '../../../sdk/user.ts'
import { config } from '../../config.ts'
import { varsMongoDbStorage } from './mongodb.ts'
import { varsMemoryStorage } from './memory.ts'

export const setKv = async <T>(userId: UserId, key: string, value: T): Promise<void> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        await varsMongoDbStorage.setKv(userId, key, value)
    } else if (type === 'memory') {
        await varsMemoryStorage.setKv(userId, key, value)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}

export const getKv = async <T>(userId: UserId, key: string): Promise<T | undefined> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        return await varsMongoDbStorage.getKv(userId, key)
    } else if (type === 'memory') {
        return await varsMemoryStorage.getKv(userId, key)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}
