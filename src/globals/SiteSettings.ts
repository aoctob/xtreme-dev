import type { GlobalConfig } from 'payload'
import { anyone, staff } from '../access'
import { revalidateEverything } from '../hooks/revalidate'
import { SOCIAL_NETWORKS } from '../lib/constants'

/** Club facts used across the site. Empty fields show a [CLUB TO SUPPLY] placeholder or hide the section. */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: staff },
  hooks: { afterChange: [revalidateEverything] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home',
          fields: [
            {
              name: 'announcement',
              type: 'text',
              admin: { description: 'Thin bar above the header, e.g. "Season trials are open." Leave empty to hide it.' },
            },
            { name: 'tagline', type: 'text', admin: { description: 'Short eyebrow line above the headline.' } },
            { name: 'heroHeadline', type: 'text', maxLength: 60, admin: { description: '8 words or fewer.' } },
            { name: 'heroLead', type: 'textarea', maxLength: 200, admin: { description: '25 words or fewer.' } },
            { name: 'heroImage', type: 'upload', relationTo: 'media', admin: { description: '16:9, at least 2560×1440, subject in the centre.' } },
            { name: 'clubIntro', type: 'textarea', maxLength: 420, admin: { description: '60 words or fewer.' } },
            { name: 'introImage', type: 'upload', relationTo: 'media' },
            { name: 'joinCtaText', type: 'text', admin: { description: 'One line on the green "Join" band.' } },
          ],
        },
        {
          label: 'About',
          fields: [
            { name: 'clubStory', type: 'textarea', admin: { description: '200 words or fewer.' } },
            { name: 'storyImage', type: 'upload', relationTo: 'media' },
            {
              type: 'row',
              fields: [
                { name: 'foundingYear', type: 'number' },
                { name: 'homeGround', type: 'text' },
                { name: 'city', type: 'text' },
              ],
            },
            {
              name: 'values',
              type: 'array',
              maxRows: 5,
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
            { name: 'badgeMeaning', type: 'textarea', admin: { description: 'Meaning of the badge and colours (optional).' } },
            {
              name: 'timeline',
              label: 'History & achievements',
              type: 'array',
              admin: { description: 'Verifiable entries only. The section is hidden when empty.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'year', type: 'text', required: true },
                    { name: 'title', type: 'text', required: true },
                  ],
                },
                { name: 'text', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email' },
                { name: 'phone', type: 'text', admin: { description: 'Shown publicly, e.g. +91 98xxxxxxxx' } },
                { name: 'whatsapp', type: 'text', admin: { description: 'Digits only with country code, e.g. 9198xxxxxxxx. Enables the WhatsApp button.' } },
              ],
            },
            { name: 'address', type: 'textarea' },
            { name: 'mapUrl', type: 'text', admin: { description: 'Google Maps link to the ground.' } },
            { name: 'mapImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional static map image.' } },
            {
              name: 'socials',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'network', type: 'select', required: true, options: SOCIAL_NETWORKS.map(({ label, value }) => ({ label, value })) },
                    { name: 'url', type: 'text', required: true },
                  ],
                },
              ],
            },
            {
              name: 'notificationEmail',
              type: 'email',
              admin: { description: 'Who receives new application and enquiry emails. Not shown on the site.' },
            },
          ],
        },
        {
          label: 'Sponsors',
          fields: [
            { name: 'sponsorPitch', type: 'textarea', admin: { description: 'Optional intro under "Why partner with the club".' } },
            {
              name: 'partnerReasons',
              type: 'array',
              maxRows: 3,
              admin: { description: 'Three short, verifiable audience facts. Do not publish numbers that cannot be verified.' },
              fields: [{ name: 'text', type: 'textarea', required: true }],
            },
            {
              name: 'placementOptions',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Privacy',
          fields: [
            { name: 'retentionPeriod', type: 'text', admin: { description: 'e.g. "12 months after the last contact". Club to decide.' } },
            { name: 'privacyContact', type: 'text', admin: { description: 'Email or phone for privacy requests.' } },
            { name: 'privacyLastUpdated', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
          ],
        },
      ],
    },
  ],
}
