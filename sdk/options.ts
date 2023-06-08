import { isMessageOfType, Message, UnknownMessage } from './message.ts'
import { findBestMatch } from 'https://deno.land/x/string_similarity@v1.0.1/mod.ts'

type Option = {
    text: string
    synonyms: string[]
}

export class Options {
    private readonly options: (Option & { originalText: string })[]

    constructor(options: (Option | string)[]) {
        this.options = options.map((option) => {
            if (typeof option === 'string') {
                return { text: option.toLowerCase(), originalText: option, synonyms: [] }
            } else {
                return {
                    text: option.text.toLowerCase(),
                    originalText: option.text,
                    synonyms: option.synonyms.map((synonym) => synonym.toLowerCase()),
                }
            }
        })
    }

    /**
     * @param text The text to be sent with the menu
     * @returns The message to be sent
     */
    public getMenu(text: string, button: string): Message<'menu'> | Message<'quick-reply'> | Message<'text'> {
        if (this.options.length <= 3 && this.options.every((option) => option.text.length <= 20)) {
            return {
                type: 'quick-reply',
                content: {
                    text,
                    options: this.options.map((option) => option.originalText),
                },
            }
        } else if (this.options.length <= 10) {
            return {
                type: 'menu',
                content: {
                    text,
                    button,
                    sections: [
                        {
                            options: this.options.map((option) => option.originalText),
                        },
                    ],
                },
            }
        } else {
            return {
                type: 'text',
                content: `${text}\n\n${this.options
                    .map((option, i) => `${i + 1} - ${option.originalText}`)
                    .join('\n')}`,
            }
        }
    }

    /**
     * @param message The input message to be matched
     * @returns The selected option, or undefined if no option was selected
     */
    public getSelectedOption(message: UnknownMessage): { text: string; index: number } | undefined {
        if (!isMessageOfType(message, 'text')) {
            return undefined
        }

        const input = message.content.toLowerCase().trim()

        const index = Number(input)
        if (index > 0 && index <= this.options.length) {
            return { text: this.options[index - 1].originalText, index: index - 1 }
        }

        const createSpace = (str: string) => ` ${str} `
        const inputWithSpaces = createSpace(input)
        const option = this.options.findIndex(
            (option) =>
                inputWithSpaces.includes(createSpace(option.text)) ||
                option.synonyms.some((synonym) => inputWithSpaces.includes(createSpace(synonym))),
        )

        if (option !== -1) {
            return { text: this.options[option].originalText, index: option }
        }

        const similarities = this.options.map((option, index) => ({
            option,
            index,
            similarity: findBestMatch(input, [option.text, ...option.synonyms]).bestMatch.rating,
        }))

        const bestSimilarity = similarities.reduce((best, current) =>
            current.similarity > best.similarity ? current : best,
        )
        if (bestSimilarity.similarity > 0.6) {
            return { text: bestSimilarity.option.originalText, index: bestSimilarity.index }
        }

        return undefined
    }
}
