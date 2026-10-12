import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Matches } from './collections/Matches'
import { Media } from './collections/Media'
import { Players } from './collections/Players'
import { Posts } from './collections/Posts'
import { Sponsors } from './collections/Sponsors'
import { Staff } from './collections/Staff'
import { Announcements } from './collections/Announcements'
import { CommitteeMembers, Conservators, Mentors } from './collections/Appointments'
import { AuditLogs } from './collections/AuditLogs'
import { FinancialSummaries } from './collections/FinancialSummaries'
import { Members } from './collections/Members'
import { privateBlobStorage } from './lib/privateBlobStorage'
import { PlayerDocuments, PlayerIdSequences, Registrations, RegistrationPhotos } from './collections/Registrations'
import { Applications, Enquiries, RateLimits } from './collections/Submissions'
import { Users } from './collections/Users'
import { JoinPage } from './globals/JoinPage'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · XTREME CLUB admin' },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo',
        Icon: '@/components/admin/Icon',
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [
    Matches,
    Staff,
    Sponsors,
    Posts,
    Media,
    Registrations,
    Players,
    Members,
    RegistrationPhotos,
    PlayerDocuments,
    PlayerIdSequences,
    Announcements,
    FinancialSummaries,
    CommitteeMembers,
    Conservators,
    Mentors,
    AuditLogs,
    Applications,
    Enquiries,
    Users,
    RateLimits,
  ],
  globals: [SiteSettings, JoinPage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || process.env.xfc_DATABASE_URL || '' },
    // Local dev pushes schema automatically; deployed builds run committed migrations (PRD §J.6).
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
          defaultFromName: 'XTREME CLUB website',
        }),
      }
    : {}),
  plugins: [
    // The project's Blob store has private access, so every file is served through Payload's
    // access-checked file route (spec §11.6): Media publicly, player photos and ID cards only to
    // permitted roles.
    privateBlobStorage({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: {
        media: { publicCache: true },
        'registration-photos': {},
        'player-documents': {},
      },
    }),
    importExportPlugin({
      collections: [
        { slug: 'applications', import: false },
        { slug: 'enquiries', import: false },
        { slug: 'registrations', import: false },
        { slug: 'members', import: false },
      ],
    }),
  ],
})
