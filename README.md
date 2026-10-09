# XTREME CLUB website

One Next.js (App Router, TypeScript) app with Payload CMS v3 embedded. The public site and the
admin panel (`/admin`) deploy together to Vercel's free Hobby plan, with content in Neon Postgres
and uploads in Vercel Blob. The public pages are a 1:1 build of the Claude Design website kit
(`ui_kits/website/index.html` in the design project, exported to `../design-import/`), on top of
the requirements in `docs/PRD_2.md` (v1.1).

## What's inside

| Area | Where |
|------|-------|
| Public pages (`/`, `/squad`, `/squad/[slug]`, `/results`, `/results/[slug]`, `/gallery`, `/about`, `/sponsors`, `/contact`, `/join`, `/register`, `/privacy`, `/search`, 404, 500). Old `/fixtures` and `/news` links redirect. | `src/app/(frontend)/` |
| Admin panel and Payload REST/GraphQL API | `src/app/(payload)/` |
| Collections: `players` (squad and guest players), `staff`, `matches`, `posts`, `media`, `sponsors`, `applications`, `registrations` (+ staff-only `registration-photos`), `enquiries`, `users` (+ hidden `rate-limits`) | `src/collections/` |
| Globals: Site settings, Join page | `src/globals/` |
| Form Server Action for Join, Register, Sponsors and Contact (validation shared with the browser, honeypot, 60 s de-dupe, Postgres rate limit 5/IP/hour, email) | `src/app/(frontend)/actions.ts`, `src/lib/validation.ts` |
| On-demand revalidation hooks | `src/hooks/revalidate.ts` |
| Design tokens and kit styles (ported from the design project) | `src/app/(frontend)/kit.css`, `ds.css` |
| Kit components (header, footer, cards, forms, gallery, motion) | `src/components/kit/` |
| Demo content from the kit's sample data | `src/seed/demo.ts` |
| SEO: metadata, `sitemap.xml`, `robots.txt`, `SportsTeam` / `SportsEvent` JSON-LD, share image | pages, `src/app/sitemap.ts`, `src/app/robots.ts`, `public/brand/` |
| Security headers (CSP, HSTS, etc.) | `next.config.ts` |
| Database migrations | `src/migrations/` |

## Local setup

Requirements: Node 20.18+ (tested on Node 24) and a Postgres database. The easiest is a free
Neon project with a `dev` branch; any local Postgres also works.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL`: your Neon **pooled** connection string (or local Postgres URL).
- `PAYLOAD_SECRET`: a long random string, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `BLOB_READ_WRITE_TOKEN`: leave empty locally; uploads are then saved in `./media`.
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000`.

```bash
npm run dev
```

Open http://localhost:3000/admin and create the first account. The first account is always an
**Admin**; later accounts default to **Editor**. In development Payload creates the tables
automatically.

Useful scripts:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build |
| `npm run migrate:create -- <name>` | Create a migration after changing a collection |
| `npm run migrate` | Apply migrations to the database in `DATABASE_URL` |
| `npm run ci` | `payload migrate` then `next build` (Vercel's build command) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `npm run seed:demo` | Fill an empty database with the kit's sample players, matches, gallery and sponsors (`-- clear` removes them). Never run it on the live site once real content exists. |

## Changing the data model

1. Edit a collection in `src/collections/` or a global in `src/globals/`.
2. `npm run generate:types`
3. `npm run migrate:create -- describe-the-change` and commit the new files in `src/migrations/`.
4. If you added admin components, also run `npm run generate:importmap`.

Deployed builds never push schema automatically; they run the committed migrations first.

## Deploying to Vercel (Hobby, free)

1. Push this folder to a GitHub repository and import it in Vercel (framework: Next.js).
   `vercel.json` already sets the build command to `npm run ci` and the function region to
   Singapore (`sin1`), close to India.
2. Create a Neon project in the AWS Singapore region (or add Neon from the Vercel Marketplace so
   each preview deployment gets its own branch). Copy the **pooled** connection string.
3. In Vercel → Storage, create a Blob store and connect it to the project (this adds
   `BLOB_READ_WRITE_TOKEN`).
4. In Vercel → Settings → Environment Variables add `DATABASE_URL`, `PAYLOAD_SECRET` and
   `NEXT_PUBLIC_SITE_URL` (the production domain, no trailing slash). Optional:
   `RESEND_API_KEY` + `EMAIL_FROM_ADDRESS` for form emails, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` for
   cookieless analytics.
5. Deploy, then open `/admin` on the live site and create the first Admin account.

Hobby plan notes (PRD §J.8): one build at a time, monthly usage allowances, and Vercel's
non-commercial terms. Images are served directly from the Blob CDN and pages are cached, which
keeps usage low. Re-check the terms before publishing paid sponsor placements.

## Everyday content tasks (club staff)

All of these happen in `/admin`; the site updates within seconds, no deploy needed.

- **Add a match:** Club → Matches → Create. Enter the opponent, kickoff (your local time; the site
  shows IST), venue and maps link. Publish. After the game set **Status** to *Full time* and
  enter both scores; optionally add scorers, link a match report and add photos.
- **Add a player:** Club → Players → Create. Tick **Consent on file** before adding a photo
  (parent/guardian consent for under-18s). Tick **Featured** to show the player on the home page.
  Set **Squad role** to *Guest player* for tournament guests; they appear under "Guest players".
- **Player registrations:** Inbox → Player registrations. These hold addresses, emergency contacts
  and medical notes, so share them only with coaches and first-aid staff.
- **Gallery:** Content → Media → upload a photo, write the alt text, tick **Show in gallery** and
  set an album. For a video, choose type *Video*, upload the poster image and paste the link.
- **Sponsors:** Club → Sponsors. A sponsor only appears when **Permission on file** is ticked.
- **Club facts, contact details, socials, trial dates, FAQ:** Settings → Site settings and
  Settings → Join page. Set **Notification email** so new applications reach the club inbox.
- **Inbox:** Inbox → Applications / Player registrations / Enquiries. Filter by status, update the status as you follow
  up, and use **Export** for the weekly CSV backup.

## Placeholders

The PRD forbids invented club facts (constraint C2). Anything the club has not supplied shows as
a `[CLUB TO SUPPLY: …]` marker on the page, as in the design kit, until it is filled in through
the admin. Sections with no data (results, gallery, sponsors, stats) are hidden or show the kit's
empty state. Launch criterion H.5 #2 is met when no marker remains. The privacy policy at `/privacy` is a
plain-language draft that **must be legally reviewed** (India DPDP Act, 2023) before launch.

## Design source

The public site follows the Claude Design project's website kit screen by screen: tokens from
`tokens/*.css`, page styles from `ui_kits/website/index.html`, components from `components/` and
page structure and copy from `ui_kits/website/kit-*.jsx`. The kit's prototype-only tools (tweaks
panel, user-flow guide) are not part of the site. The club name shown on the site is the
`CLUB_NAME` constant in `src/lib/constants.ts` ("XTREME CLUB", as in the kit), and the badge in
`public/brand/` is the kit's emblem. Fonts are self-hosted Archivo and Inter.

The site has no News pages because the kit has none; the News collection is kept in the admin
for match reports and can be removed later.
