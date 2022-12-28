import { UserId } from '../../../sdk/user.ts'
import { config } from '../../config.ts'
import { logger } from '../../log.ts'
import { trackMongoDbStorage } from './mongodb.ts'

export const track = async (userId: UserId, event: string, properties: Record<string, unknown>): Promise<void> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        await trackMongoDbStorage.track(userId, event, properties)
    } else if (type === 'memory') {
        logger.info(`Tracking ~ ${event} (${userId})`, properties)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}
