import * as log from 'https://deno.land/std@0.170.0/log/mod.ts'

export const logger = {
    debug: log.debug,
    info: log.info,
    warning: log.warning,
    error: log.error,
    critical: log.critical,
}
