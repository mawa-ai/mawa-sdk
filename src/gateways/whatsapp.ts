import { UnknownMessage } from '../../sdk/message.ts'
import { getIdFromSourceId, mergeUser } from '../services/user.ts'
import { Gateway, SourceMessage } from './gateway.ts'

export class WhatsappGateway implements Gateway {
    public sourceId = 'whatsapp'

    public async receive(request: Request): Promise<SourceMessage> {
        const body = await request.json()
        console.log(body)
        const userId = getIdFromSourceId('teste', this.sourceId)
        await mergeUser(userId, {})

        return { sourceAuthorId: 'teste', message: { type: 'text', content: 'teste' } }
        return {} as SourceMessage
    }

    public send(sourceAuthorId: string, message: UnknownMessage): Promise<void> {
        return Promise.resolve()
    }
}
