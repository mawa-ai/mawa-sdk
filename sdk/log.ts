import { getLogger, handlers } from 'https://deno.land/std@0.170.0/log/mod.ts'
import { onConfigurationsLoaded } from '../src/config.ts'

export const logger = getLogger('mawa')
logger.handlers = [
    new handlers.ConsoleHandler('NOTSET', {
        formatter: (logRecord) => {
            const args = logRecord.args.map((arg) => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg)
                }
                return arg
            })
            return `[${logRecord.levelName}] ${logRecord.msg} ${args.join(' ')}`
        },
    }),
]

onConfigurationsLoaded((configuration) => {
    if (configuration.logLevel) {
        logger.levelName = configuration.logLevel || 'INFO'
    }
})
