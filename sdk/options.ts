import { Message } from './message.ts'
import { findBestMatch } from 'https://deno.land/x/string_similarity@v1.0.1/mod.ts'

type Option = {
    text: string
    synonyms: string[]
}

export class Options {
    constructor(private readonly options: Option[]) {}

    public getMenu(text: string): Message<'menu'> | Message<'quick-reply'> | Message<'text'> {
        if (this.options.length <= 3 && this.options.every((option) => option.text.length <= 20)) {
            return {
                type: 'quick-reply',
                content: {
                    text,
                    options: this.options.map((option) => option.text),
                },
            }
        } else if (this.options.length <= 10) {
            return {
                type: 'menu',
                content: {
                    text,
                    sections: [
                        {
                            options: this.options.map((option) => option.text),
                        },
                    ],
                },
            }
        } else {
            return {
                type: 'text',
                content: `${text}\n\n${this.options.map((option, i) => `${i + 1} - ${option.text}`).join('\n')}`,
            }
        }
    }

    public getSelectedOption(input: string): number {
        let index = -1
        if (input.match(/primeir[oa]/g)) {
            index = 1
        } else if (input.match(/segund[oa]/g)) {
            index = 2
        } else if (input.match(/terceir[oa]/g)) {
            index = 3
        } else if (input.match(/terç[oa]/g)) {
            index = 3
        } else if (input.match(/quart[oa]/g)) {
            index = 4
        } else if (input.match(/quint[oa]/g)) {
            index = 5
        } else if (input.match(/sext[oa]/g)) {
            index = 6
        } else if (input.match(/s[eé]tim[oa]/g)) {
            index = 7
        } else if (input.match(/oitav[oa]/g)) {
            index = 8
        } else if (input.match(/non[oa]/g)) {
            index = 9
        }

        if (index === -1) {
            index = Number(input)
        }

        if (index > 0 && index <= this.options.length) {
            return index - 1
        }

        const createSpace = (str: string) => ` ${str} `
        const inputWithSpaces = createSpace(input)
        const option = this.options.findIndex(
            (option) =>
                inputWithSpaces.includes(createSpace(option.text)) ||
                option.synonyms.some((synonym) => inputWithSpaces.includes(createSpace(synonym))),
        )

        if (option !== -1) {
            return option
        }

        const similarities = this.options.map((option, index) => ({
            index,
            similarity: findBestMatch(input, [option.text, ...option.synonyms]).bestMatch.rating,
        }))

        const bestSimilarity = similarities.reduce((best, current) =>
            current.similarity > best.similarity ? current : best,
        )
        if (bestSimilarity.similarity > 0.6) {
            return bestSimilarity.index
        }

        return -1
    }
}