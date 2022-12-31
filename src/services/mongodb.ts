import { Collection, Database, MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts'
import { config } from '../config.ts'

let database: Database
export const getCollection = async <T>(collection: string): Promise<Collection<T>> => {
    const storageConfig = config().storage
    if (storageConfig.type !== 'mongodb') throw new Error('Storage type is not mongodb')

    if (!database) {
        const client = new MongoClient()
        database = await client.connect(storageConfig.config.url)
    }
    return database.collection<T>(collection)
}
