// return {
//     type: 'interactive',
//     interactive: {
//         type: 'list',
//         body: {
//             text: message.content.text,
//         },
//         action: {
//             button: message.content.button,
//             sections: message.content.sections.map((section, sectionIndex) => ({
//                 title: section.title,
//                 rows: section.options.map((option, optionIndex) => {
//                     if (typeof option === 'string') {
//                         return {
//                             id: `${sectionIndex}.${optionIndex}`,
//                             title: option,
//                         }
//                     } else {
//                         return {
//                             id: `${sectionIndex}.${optionIndex}`,
//                             title: option.title,
//                             description: option.description,
//                         }
//                     }
//                 }),
//             })),
//         },
//     },
// }
