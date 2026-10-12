import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registrations_blood_group" AS ENUM('a-pos', 'a-neg', 'b-pos', 'b-neg', 'ab-pos', 'ab-neg', 'o-pos', 'o-neg', 'unknown');
  CREATE TYPE "public"."enum_registrations_education_bachelors_degree" AS ENUM('ba', 'bsc', 'bcom', 'bba', 'bca', 'btech', 'barch', 'bped', 'bed', 'llb', 'mbbs', 'ayush', 'bpharm', 'nursing', 'bhm', 'bfa', 'bsw', 'bvoc', 'other');
  CREATE TYPE "public"."enum_registrations_education_masters_degree" AS ENUM('ma', 'msc', 'mcom', 'mba', 'mca', 'mtech', 'march', 'mped', 'med', 'llm', 'md', 'mpharm', 'mpt', 'mfa', 'msw', 'other');
  CREATE TABLE "player_id_sequences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric NOT NULL,
  	"last" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "registrations" ADD COLUMN "player_id" varchar;
  ALTER TABLE "registrations" ADD COLUMN "whatsapp" varchar;
  ALTER TABLE "registrations" ADD COLUMN "blood_group" "enum_registrations_blood_group";
  ALTER TABLE "registrations" ADD COLUMN "education_school_name" varchar;
  ALTER TABLE "registrations" ADD COLUMN "education_bachelors_degree" "enum_registrations_education_bachelors_degree";
  ALTER TABLE "registrations" ADD COLUMN "education_bachelors_college" varchar;
  ALTER TABLE "registrations" ADD COLUMN "education_masters_degree" "enum_registrations_education_masters_degree";
  ALTER TABLE "registrations" ADD COLUMN "education_masters_college" varchar;
  ALTER TABLE "registrations" ADD COLUMN "education_other" varchar;
  ALTER TABLE "registrations" ADD COLUMN "identity_aadhaar_number" varchar;
  ALTER TABLE "registrations" ADD COLUMN "identity_aadhaar_image_id" integer;
  ALTER TABLE "registrations" ADD COLUMN "identity_pan_number" varchar;
  ALTER TABLE "registrations" ADD COLUMN "identity_pan_image_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "player_id_sequences_id" integer;
  CREATE UNIQUE INDEX "player_id_sequences_year_idx" ON "player_id_sequences" USING btree ("year");
  CREATE INDEX "player_id_sequences_updated_at_idx" ON "player_id_sequences" USING btree ("updated_at");
  CREATE INDEX "player_id_sequences_created_at_idx" ON "player_id_sequences" USING btree ("created_at");
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_identity_aadhaar_image_id_player_documents_id_fk" FOREIGN KEY ("identity_aadhaar_image_id") REFERENCES "public"."player_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_identity_pan_image_id_player_documents_id_fk" FOREIGN KEY ("identity_pan_image_id") REFERENCES "public"."player_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_player_id_sequences_fk" FOREIGN KEY ("player_id_sequences_id") REFERENCES "public"."player_id_sequences"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "registrations_player_id_idx" ON "registrations" USING btree ("player_id");
  CREATE INDEX "registrations_identity_identity_aadhaar_image_idx" ON "registrations" USING btree ("identity_aadhaar_image_id");
  CREATE INDEX "registrations_identity_identity_pan_image_idx" ON "registrations" USING btree ("identity_pan_image_id");
  CREATE INDEX "payload_locked_documents_rels_player_id_sequences_id_idx" ON "payload_locked_documents_rels" USING btree ("player_id_sequences_id");`)

  // Players approved before Player IDs existed get one now, numbered in approval order within
  // each IST year, and the counters start after them so new approvals never repeat a number.
  await db.execute(sql`
  WITH approved AS (
    SELECT id, COALESCE(approved_at, updated_at) AS at,
      EXTRACT(YEAR FROM COALESCE(approved_at, updated_at) AT TIME ZONE 'Asia/Kolkata')::int AS yr
    FROM registrations
    WHERE application_status = 'approved' AND player_id IS NULL
  ), numbered AS (
    SELECT id, yr, ROW_NUMBER() OVER (PARTITION BY yr ORDER BY at, id) AS n FROM approved
  )
  UPDATE registrations r
  SET player_id = 'xfc-' || lpad((numbered.yr % 100)::text, 2, '0') || '-' || lpad(numbered.n::text, 4, '0')
  FROM numbered
  WHERE r.id = numbered.id;

  INSERT INTO player_id_sequences (year, last)
  SELECT EXTRACT(YEAR FROM COALESCE(approved_at, updated_at) AT TIME ZONE 'Asia/Kolkata')::int, count(*)
  FROM registrations
  WHERE player_id IS NOT NULL
  GROUP BY 1;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "player_id_sequences" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "player_id_sequences" CASCADE;
  ALTER TABLE "registrations" DROP CONSTRAINT "registrations_identity_aadhaar_image_id_player_documents_id_fk";
  
  ALTER TABLE "registrations" DROP CONSTRAINT "registrations_identity_pan_image_id_player_documents_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_player_id_sequences_fk";
  
  DROP INDEX "registrations_player_id_idx";
  DROP INDEX "registrations_identity_identity_aadhaar_image_idx";
  DROP INDEX "registrations_identity_identity_pan_image_idx";
  DROP INDEX "payload_locked_documents_rels_player_id_sequences_id_idx";
  ALTER TABLE "registrations" DROP COLUMN "player_id";
  ALTER TABLE "registrations" DROP COLUMN "whatsapp";
  ALTER TABLE "registrations" DROP COLUMN "blood_group";
  ALTER TABLE "registrations" DROP COLUMN "education_school_name";
  ALTER TABLE "registrations" DROP COLUMN "education_bachelors_degree";
  ALTER TABLE "registrations" DROP COLUMN "education_bachelors_college";
  ALTER TABLE "registrations" DROP COLUMN "education_masters_degree";
  ALTER TABLE "registrations" DROP COLUMN "education_masters_college";
  ALTER TABLE "registrations" DROP COLUMN "education_other";
  ALTER TABLE "registrations" DROP COLUMN "identity_aadhaar_number";
  ALTER TABLE "registrations" DROP COLUMN "identity_aadhaar_image_id";
  ALTER TABLE "registrations" DROP COLUMN "identity_pan_number";
  ALTER TABLE "registrations" DROP COLUMN "identity_pan_image_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "player_id_sequences_id";
  DROP TYPE "public"."enum_registrations_blood_group";
  DROP TYPE "public"."enum_registrations_education_bachelors_degree";
  DROP TYPE "public"."enum_registrations_education_masters_degree";`)
}
