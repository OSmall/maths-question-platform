import {Block} from "payload";

export const McqBlock : Block = {
    slug: 'mcq',
    fields: [
        {
            name: 'options',
            type: 'array',
            fields: [
                { name: 'text', type: 'text', required: true },
                { name: 'is_correct', type: 'checkbox' },
            ]
        },
        { name: 'shuffle', type: 'checkbox' }
    ]
};