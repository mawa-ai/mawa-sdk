import { getLogger, handlers, LevelName } from 'https://deno.land/std@0.170.0/log/mod.ts'

export const logger = getLogger('mawa')

export const setup = (levelName: LevelName) => {
    logger.levelName = levelName
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
}
