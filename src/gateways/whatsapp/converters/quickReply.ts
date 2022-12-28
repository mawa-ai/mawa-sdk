// return {
//     type: 'interactive',
//     interactive: {
//         type: 'button',
//         body: {
//             text: message.content.text,
//         },
//         action: {
//             buttons: message.content.options.map((option, optionIndex) => ({
//                 type: 'reply',
//                 reply: {
//                     id: `${optionIndex}`,
//                     title: option,
//                 },
//             })),
//         },
//     },
// }
