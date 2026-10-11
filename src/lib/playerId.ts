import { sql } from '@payloadcms/db-postgres'
import type { PayloadRequest } from 'payload'
import { TIME_ZONE } from './constants'
import { formatPlayerId } from './validation'

type Session = { db: { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Record<string, unknown>[] }> } }

/**
 * Next Player ID for the year of `at` in IST, e.g. "xfc-26-0001". The counter lives in
 * `player_id_sequences` and only ever goes up, so an ID is never handed out twice, even if
 * a record is later deleted or its approval withdrawn. The upsert runs in the request's
 * transaction and Postgres locks the year's row, so two approvals at once get different serials.
 */
export async function nextPlayerId(req: PayloadRequest, at = new Date()): Promise<string> {
  const year = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: 'numeric' }).format(at))
  const adapter = req.payload.db as unknown as { drizzle: Session['db']; sessions: Record<string, Session | undefined> }
  const db = (req.transactionID && adapter.sessions[String(await req.transactionID)]?.db) || adapter.drizzle
  const { rows } = await db.execute(sql`
    INSERT INTO player_id_sequences (year, last, updated_at, created_at)
    VALUES (${year}, 1, now(), now())
    ON CONFLICT (year) DO UPDATE SET last = player_id_sequences.last + 1, updated_at = now()
    RETURNING last
  `)
  return formatPlayerId(year, Number(rows[0].last))
}
