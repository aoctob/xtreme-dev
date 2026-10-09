import type { GlobalConfig } from 'payload'
import { anyone, staff } from '../access'
import { revalidateEverything } from '../hooks/revalidate'

/** Trial information for /join (PRD §D.10). */
export const JoinPage: GlobalConfig = {
  slug: 'join-page',
  label: 'Join page',
  admin: { group: 'Settings' },
  access: { read: anyone, update: staff },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    { name: 'whoCanJoin', type: 'textarea', admin: { description: 'Age groups and levels.' } },
    { name: 'ageGroups', type: 'text' },
    { name: 'trialLocation', type: 'text' },
    { name: 'trialLocationMapUrl', type: 'text' },
    {
      name: 'trialDates',
      type: 'array',
      admin: { description: 'Published dates appear in the form\'s "Preferred trial date" list.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'start', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
            { name: 'note', type: 'text', admin: { description: 'e.g. "Under-16s only"' } },
          ],
        },
      ],
    },
    { name: 'whatToBring', type: 'textarea' },
    { name: 'fees', type: 'text', admin: { description: 'Leave empty to show "Contact the club".' } },
    {
      name: 'faq',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    { name: 'responseTime', type: 'text', admin: { description: 'e.g. "within 3 days". Shown after an application is sent.' } },
  ],
}
