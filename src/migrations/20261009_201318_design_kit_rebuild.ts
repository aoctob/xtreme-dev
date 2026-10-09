import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_players_squad_role" AS ENUM('squad', 'guest');
  CREATE TYPE "public"."enum_registrations_status" AS ENUM('new', 'approved', 'needs-info', 'declined');
  CREATE TYPE "public"."enum_registrations_mode" AS ENUM('player', 'committee');
  CREATE TYPE "public"."enum_registrations_registered_by_role" AS ENUM('secretary', 'coach', 'team-manager', 'treasurer', 'other');
  CREATE TYPE "public"."enum_registrations_team" AS ENUM('unassigned', 'senior', 'youth');
  CREATE TYPE "public"."enum_registrations_foot" AS ENUM('right', 'left', 'both');
  CREATE TYPE "public"."enum_registrations_position" AS ENUM('not-sure', 'gk', 'defender', 'midfielder', 'forward');
  CREATE TYPE "public"."enum_registrations_second_position" AS ENUM('gk', 'defender', 'midfielder', 'forward');
  CREATE TABLE "registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_registrations_status" DEFAULT 'new' NOT NULL,
  	"mode" "enum_registrations_mode" NOT NULL,
  	"registered_by_name" varchar,
  	"registered_by_role" "enum_registrations_registered_by_role",
  	"registered_by_phone" varchar,
  	"full_name" varchar NOT NULL,
  	"date_of_birth" timestamp(3) with time zone NOT NULL,
  	"phone" varchar,
  	"email" varchar,
  	"address" varchar NOT NULL,
  	"photo_id" integer,
  	"guardian_name" varchar,
  	"guardian_phone" varchar,
  	"team" "enum_registrations_team",
  	"foot" "enum_registrations_foot",
  	"position" "enum_registrations_position",
  	"second_position" "enum_registrations_second_position",
  	"shirt_number" numeric,
  	"previous_club" varchar,
  	"emergency_name" varchar,
  	"emergency_relationship" varchar,
  	"emergency_phone" varchar,
  	"medical" varchar,
  	"is_minor" boolean,
  	"guardian_consent" boolean,
  	"committee_confirmed" boolean,
  	"consent" boolean DEFAULT false NOT NULL,
  	"notes" varchar,
  	"fingerprint" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "registration_photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  CREATE TABLE "site_settings_partner_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "applications" ALTER COLUMN "preferred_position" SET DATA TYPE text;
  DROP TYPE "public"."enum_applications_preferred_position";
  CREATE TYPE "public"."enum_applications_preferred_position" AS ENUM('not-sure', 'gk', 'defender', 'midfielder', 'forward');
  ALTER TABLE "applications" ALTER COLUMN "preferred_position" SET DATA TYPE "public"."enum_applications_preferred_position" USING "preferred_position"::"public"."enum_applications_preferred_position";
  ALTER TABLE "sponsors" ALTER COLUMN "logo_id" DROP NOT NULL;
  ALTER TABLE "players" ADD COLUMN "squad_role" "enum_players_squad_role" DEFAULT 'squad' NOT NULL;
  ALTER TABLE "players" ADD COLUMN "guest_appearances" numeric;
  ALTER TABLE "players" ADD COLUMN "guest_event" varchar;
  ALTER TABLE "applications" ADD COLUMN "guardian_consent" boolean;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "registrations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "registration_photos_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "announcement" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "city" varchar;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_photo_id_registration_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."registration_photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_partner_reasons" ADD CONSTRAINT "site_settings_partner_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "registrations_status_idx" ON "registrations" USING btree ("status");
  CREATE INDEX "registrations_photo_idx" ON "registrations" USING btree ("photo_id");
  CREATE INDEX "registrations_fingerprint_idx" ON "registrations" USING btree ("fingerprint");
  CREATE INDEX "registrations_updated_at_idx" ON "registrations" USING btree ("updated_at");
  CREATE INDEX "registrations_created_at_idx" ON "registrations" USING btree ("created_at");
  CREATE INDEX "registration_photos_updated_at_idx" ON "registration_photos" USING btree ("updated_at");
  CREATE INDEX "registration_photos_created_at_idx" ON "registration_photos" USING btree ("created_at");
  CREATE UNIQUE INDEX "registration_photos_filename_idx" ON "registration_photos" USING btree ("filename");
  CREATE INDEX "registration_photos_sizes_thumb_sizes_thumb_filename_idx" ON "registration_photos" USING btree ("sizes_thumb_filename");
  CREATE INDEX "site_settings_partner_reasons_order_idx" ON "site_settings_partner_reasons" USING btree ("_order");
  CREATE INDEX "site_settings_partner_reasons_parent_id_idx" ON "site_settings_partner_reasons" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registrations_fk" FOREIGN KEY ("registrations_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registration_photos_fk" FOREIGN KEY ("registration_photos_id") REFERENCES "public"."registration_photos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("registrations_id");
  CREATE INDEX "payload_locked_documents_rels_registration_photos_id_idx" ON "payload_locked_documents_rels" USING btree ("registration_photos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "registration_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_partner_reasons" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "registrations" CASCADE;
  DROP TABLE "registration_photos" CASCADE;
  DROP TABLE "site_settings_partner_reasons" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_registrations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_registration_photos_fk";
  
  ALTER TABLE "applications" ALTER COLUMN "preferred_position" SET DATA TYPE text;
  DROP TYPE "public"."enum_applications_preferred_position";
  CREATE TYPE "public"."enum_applications_preferred_position" AS ENUM('gk', 'defender', 'midfielder', 'forward', 'not-sure');
  ALTER TABLE "applications" ALTER COLUMN "preferred_position" SET DATA TYPE "public"."enum_applications_preferred_position" USING "preferred_position"::"public"."enum_applications_preferred_position";
  DROP INDEX "payload_locked_documents_rels_registrations_id_idx";
  DROP INDEX "payload_locked_documents_rels_registration_photos_id_idx";
  ALTER TABLE "sponsors" ALTER COLUMN "logo_id" SET NOT NULL;
  ALTER TABLE "players" DROP COLUMN "squad_role";
  ALTER TABLE "players" DROP COLUMN "guest_appearances";
  ALTER TABLE "players" DROP COLUMN "guest_event";
  ALTER TABLE "applications" DROP COLUMN "guardian_consent";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "registrations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "registration_photos_id";
  ALTER TABLE "site_settings" DROP COLUMN "announcement";
  ALTER TABLE "site_settings" DROP COLUMN "city";
  DROP TYPE "public"."enum_players_squad_role";
  DROP TYPE "public"."enum_registrations_status";
  DROP TYPE "public"."enum_registrations_mode";
  DROP TYPE "public"."enum_registrations_registered_by_role";
  DROP TYPE "public"."enum_registrations_team";
  DROP TYPE "public"."enum_registrations_foot";
  DROP TYPE "public"."enum_registrations_position";
  DROP TYPE "public"."enum_registrations_second_position";`)
}
