import { isMessage, UnknownMessage } from '../../../sdk/message.ts'
import { Gateway, MessageHandler } from '../gateway.ts'
import { config } from '../../config.ts'
import { WebChannelConfiguration } from '../../../sdk/config.ts'
import { getIdFromSourceId } from '../../services/user/user.ts'
import { getKv, setKv } from '../../services/vars/vars.ts'

export class WebGateway implements Gateway {
    public readonly sourceId = 'web'

    private readonly activeConnections = new Map<string, UnknownMessage[]>()

    public async receive(request: Request): Promise<Response | void> {
        const url = new URL(request.url)
        const customAction = url.searchParams.get('action')

        if (request.method === 'OPTIONS') {
            const response = new Response()
            response.headers.set(
                'Access-Control-Allow-Origin',
                this.config.allowedOrigins ? this.config.allowedOrigins.join(',') : '*',
            )
            response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            return response
        } else if (request.method === 'GET' && customAction === 'auth') {
            if (
                this.config.authorizationToken &&
                this.config.authorizationToken !== request.headers.get('Authorization')
            ) {
                return new Response('Unauthorized', { status: 401 })
            }

            const sourceId = crypto.randomUUID()
            const userId = getIdFromSourceId(sourceId, this.sourceId)
            const password = crypto.randomUUID()

            await setKv(userId, '#web-password', password)
            const response = Response.json({
                user: sourceId,
                password: password,
            })

            response.headers.set(
                'Access-Control-Allow-Origin',
                this.config.allowedOrigins ? this.config.allowedOrigins.join(',') : '*',
            )
            return response
        }
    }

    public async handle(request: Request, onMessage: MessageHandler): Promise<Response> {
        const auth = request.headers.get('Authorization')
        if (!auth) {
            return new Response('Unauthorized', { status: 401 })
        }

        const [type, token] = auth.split(' ')
        if (type !== 'Basic') {
            return new Response('Unauthorized', { status: 401 })
        }

        const [sourceId, password] = atob(token).split(':')
        const userId = getIdFromSourceId(sourceId, this.sourceId)
        const storedPassword = await getKv(userId, '#web-password')
        if (password !== storedPassword) {
            return new Response('Unauthorized', { status: 401 })
        }

        this.activeConnections.set(sourceId, [])

        try {
            const message = await request.json()
            if (!isMessage(message)) {
                return new Response('Invalid message', { status: 400 })
            }

            await onMessage(sourceId, message, this)
            const response = Response.json(this.activeConnections.get(sourceId))

            response.headers.set(
                'Access-Control-Allow-Origin',
                this.config.allowedOrigins ? this.config.allowedOrigins.join(',') : '*',
            )
            return response
        } finally {
            this.activeConnections.delete(sourceId)
        }
    }

    public send(sourceUserId: string, message: UnknownMessage): Promise<void> {
        const messages = this.activeConnections.get(sourceUserId)
        if (messages) {
            messages.push(message)
        }
        return Promise.resolve()
    }

    private get config(): WebChannelConfiguration {
        return config().channels.web!
    }
}
