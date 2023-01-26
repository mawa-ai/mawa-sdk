import * as log from 'https://deno.land/std@0.170.0/log/mod.ts'

export const setMinimumLogLevel = (level: log.LevelName) => {
    log.setup({
        handlers: {
            default: new log.handlers.ConsoleHandler('NOTSET', {
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
        },

        loggers: {
            default: {
                level,
                handlers: ['default'],
            },
        },
    })
}

export const logger = {
    debug: log.debug,
    info: log.info,
    warning: log.warning,
    error: log.error,
    critical: log.critical,
}
