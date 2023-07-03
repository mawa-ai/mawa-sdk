import { State } from './state.ts'
import { Hooks } from './hooks.ts'

export type Plugin = {
    id: string

    hooks: Partial<Hooks>
    states: Record<string, State>

    initialize?: () => Promise<void>
}
