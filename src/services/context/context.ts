import { UserId } from '../../../sdk/user.ts'
import { config } from '../../config.ts'
import { contextMongoDbStorage } from './mongodb.ts'
import { contextMemoryStorage } from './memory.ts'

export const setKv = async <T>(userId: UserId, key: string, value: T): Promise<void> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        await contextMongoDbStorage.setKv(userId, key, value)
    } else if (type === 'memory') {
        await contextMemoryStorage.setKv(userId, key, value)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}

export const getKv = async <T>(userId: UserId, key: string): Promise<T | undefined> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        return await contextMongoDbStorage.getKv(userId, key)
    } else if (type === 'memory') {
        return await contextMemoryStorage.getKv(userId, key)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}
