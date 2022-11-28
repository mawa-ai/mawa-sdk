import { Collection, Database, MongoClient } from 'https://deno.land/x/mongo@v0.31.1/mod.ts'
import { config } from '../config.ts'

let database: Database
export const getCollection = async <T>(collection: string): Promise<Collection<T>> => {
    if (!database) {
        const client = new MongoClient()
        await client.connect(config().mongodb.url)
        database = client.database(config().mongodb.database)
    }
    return database.collection<T>(collection)
}
