import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
import { PlayerDocuments, Registrations, RegistrationPhotos } from './collections/Registrations'
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
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      alwaysInsertFields: true,
      // Uploads go straight from the browser to Blob, avoiding the 4.5 MB function body limit on Hobby.
      clientUploads: true,
      // Random suffixes stop anyone guessing a private file's Blob URL (spec §11.6).
      addRandomSuffix: true,
      collections: {
        // Serve files from the Blob CDN directly instead of through a function (keeps Hobby usage low).
        media: { disablePayloadAccessControl: true },
        // Private files keep access control: Payload serves them only to authorised roles.
        'registration-photos': true,
        'player-documents': true,
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
