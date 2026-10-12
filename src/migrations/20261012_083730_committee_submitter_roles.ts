import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_registrations_registered_by_role" ADD VALUE 'joint-secretary' BEFORE 'coach';
  ALTER TYPE "public"."enum_registrations_registered_by_role" ADD VALUE 'super-admin' BEFORE 'coach';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registrations" ALTER COLUMN "registered_by_role" SET DATA TYPE text;
  UPDATE "registrations" SET "registered_by_role" = 'other' WHERE "registered_by_role" IN ('joint-secretary', 'super-admin');
  DROP TYPE "public"."enum_registrations_registered_by_role";
  CREATE TYPE "public"."enum_registrations_registered_by_role" AS ENUM('secretary', 'coach', 'team-manager', 'treasurer', 'other');
  ALTER TABLE "registrations" ALTER COLUMN "registered_by_role" SET DATA TYPE "public"."enum_registrations_registered_by_role" USING "registered_by_role"::"public"."enum_registrations_registered_by_role";`)
}
