import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Carry any existing data over to the new fields before the old columns go.
  await db.execute(sql`
  UPDATE "registrations" SET "application_status" = (CASE "status"
    WHEN 'approved' THEN 'approved' WHEN 'needs-info' THEN 'changes_requested' WHEN 'declined' THEN 'rejected' ELSE 'pending' END
  )::"enum_registrations_application_status";
  UPDATE "registrations" SET "review_notes" = "notes" WHERE "notes" IS NOT NULL AND "review_notes" IS NULL;
  INSERT INTO "users_roles" ("order", "parent_id", "value")
    SELECT 1, u."id", (CASE u."role" WHEN 'admin' THEN 'super-admin' ELSE 'editor' END)::"enum_users_roles"
    FROM "users" u WHERE NOT EXISTS (SELECT 1 FROM "users_roles" r WHERE r."parent_id" = u."id");
  UPDATE "players" SET "publication_status" = 'published';`)
  await db.execute(sql`
   DROP INDEX "registrations_status_idx";
  ALTER TABLE "registrations" DROP COLUMN "status";
  ALTER TABLE "registrations" DROP COLUMN "notes";
  ALTER TABLE "users" DROP COLUMN "role";
  DROP TYPE "public"."enum_registrations_status";
  DROP TYPE "public"."enum_users_role";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registrations_status" AS ENUM('new', 'approved', 'needs-info', 'declined');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "registrations" ADD COLUMN "status" "enum_registrations_status" DEFAULT 'new' NOT NULL;
  ALTER TABLE "registrations" ADD COLUMN "notes" varchar;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  CREATE INDEX "registrations_status_idx" ON "registrations" USING btree ("status");`)
}
