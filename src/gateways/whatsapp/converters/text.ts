import { Converter } from '../../converter.ts'

export const whatsappTextConverter: Converter<'text'> = {
    type: 'text',
    convertToSourceMessage: (content) => ({
        type: 'text',
        text: {
            body: content,
        },
    }),
    convertFromSourceMessage: (sourceMessage: { text: { body: string } }) => {
        return sourceMessage.text.body
    },
    isSourceConverter: (sourceMessage) => (sourceMessage as { type: string }).type === 'text',
}
