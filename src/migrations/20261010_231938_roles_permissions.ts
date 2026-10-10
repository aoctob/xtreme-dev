import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registrations_application_status" AS ENUM('pending', 'under_review', 'changes_requested', 'approved', 'rejected');
  CREATE TYPE "public"."enum_registrations_membership_status" AS ENUM('pending', 'active', 'suspended', 'inactive');
  CREATE TYPE "public"."enum_players_publication_status" AS ENUM('draft', 'pending_publication', 'published', 'unpublished');
  CREATE TYPE "public"."enum_members_membership_type" AS ENUM('playing', 'non-playing', 'honorary');
  CREATE TYPE "public"."enum_members_membership_status" AS ENUM('pending', 'active', 'suspended', 'inactive');
  CREATE TYPE "public"."enum_announcements_category" AS ENUM('club', 'matches', 'training', 'registration', 'events');
  CREATE TYPE "public"."enum_announcements_status" AS ENUM('draft', 'published', 'unpublished');
  CREATE TYPE "public"."enum_committee_members_position" AS ENUM('president', 'vice-president', 'secretary', 'joint-secretary', 'treasurer');
  CREATE TYPE "public"."enum_committee_members_status" AS ENUM('active', 'ended');
  CREATE TYPE "public"."enum_conservators_status" AS ENUM('active', 'ended');
  CREATE TYPE "public"."enum_mentors_status" AS ENUM('active', 'ended');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'request-changes', 'status-change', 'resubmit', 'publish', 'unpublish', 'role-change', 'appoint', 'end-appointment', 'finance-update', 'invite');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('super-admin', 'editor', 'player', 'member');
  CREATE TYPE "public"."enum_users_positions" AS ENUM('president', 'vice-president', 'secretary', 'joint-secretary', 'treasurer', 'conservator', 'mentor');
  CREATE TYPE "public"."enum_users_account_status" AS ENUM('active', 'disabled');
  CREATE TABLE "registrations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"player_documents_id" integer
  );
  
  CREATE TABLE "members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"membership_type" "enum_members_membership_type",
  	"email" varchar,
  	"phone" varchar,
  	"address" varchar,
  	"joined_on" timestamp(3) with time zone,
  	"renewal_due" timestamp(3) with time zone,
  	"membership_status" "enum_members_membership_status" DEFAULT 'pending' NOT NULL,
  	"user_id" integer,
  	"player_record_id" integer,
  	"notes" varchar,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "player_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
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
  	"focal_y" numeric
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"featured_image_id" integer,
  	"category" "enum_announcements_category" DEFAULT 'club' NOT NULL,
  	"status" "enum_announcements_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"created_by_id" integer,
  	"last_modified_by_id" integer,
  	"published_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "financial_summaries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"period" varchar NOT NULL,
  	"period_start" timestamp(3) with time zone NOT NULL,
  	"period_end" timestamp(3) with time zone NOT NULL,
  	"opening_balance" numeric NOT NULL,
  	"total_income" numeric NOT NULL,
  	"total_expenses" numeric NOT NULL,
  	"closing_balance" numeric NOT NULL,
  	"notes" varchar,
  	"supporting_reference" varchar,
  	"created_by_id" integer,
  	"updated_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "committee_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"position" "enum_committee_members_position" NOT NULL,
  	"order" numeric DEFAULT 0,
  	"status" "enum_committee_members_status" DEFAULT 'active' NOT NULL,
  	"user_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"photo_id" integer,
  	"bio" varchar,
  	"handover_notes" varchar,
  	"appointed_by_id" integer,
  	"ended_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "conservators" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_conservators_status" DEFAULT 'active' NOT NULL,
  	"user_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"photo_id" integer,
  	"bio" varchar,
  	"handover_notes" varchar,
  	"appointed_by_id" integer,
  	"ended_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mentors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_mentors_status" DEFAULT 'active' NOT NULL,
  	"user_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"photo_id" integer,
  	"bio" varchar,
  	"handover_notes" varchar,
  	"appointed_by_id" integer,
  	"ended_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"target_collection" varchar NOT NULL,
  	"record_id" varchar,
  	"record_label" varchar,
  	"actor_id" integer,
  	"actor_name" varchar,
  	"actor_roles" varchar,
  	"summary" varchar,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_positions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_positions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "players" ADD COLUMN "publication_status" "enum_players_publication_status" DEFAULT 'draft' NOT NULL;
  ALTER TABLE "players" ADD COLUMN "record_id" integer;
  ALTER TABLE "players" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "players" ADD COLUMN "published_by_id" integer;
  ALTER TABLE "registrations" ADD COLUMN "application_status" "enum_registrations_application_status" DEFAULT 'pending' NOT NULL;
  ALTER TABLE "registrations" ADD COLUMN "membership_status" "enum_registrations_membership_status";
  ALTER TABLE "registrations" ADD COLUMN "user_id" integer;
  ALTER TABLE "registrations" ADD COLUMN "changes_requested" varchar;
  ALTER TABLE "registrations" ADD COLUMN "player_response" varchar;
  ALTER TABLE "registrations" ADD COLUMN "resubmitted_at" timestamp(3) with time zone;
  ALTER TABLE "registrations" ADD COLUMN "review_notes" varchar;
  ALTER TABLE "registrations" ADD COLUMN "rejection_reason" varchar;
  ALTER TABLE "registrations" ADD COLUMN "reviewed_by_id" integer;
  ALTER TABLE "registrations" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "registrations" ADD COLUMN "approved_by_id" integer;
  ALTER TABLE "registrations" ADD COLUMN "approved_at" timestamp(3) with time zone;
  ALTER TABLE "registrations" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "registrations" ADD COLUMN "archived" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "account_status" "enum_users_account_status" DEFAULT 'active' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "player_documents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "announcements_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "financial_summaries_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "committee_members_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "conservators_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mentors_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" integer;
  ALTER TABLE "registrations_rels" ADD CONSTRAINT "registrations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "registrations_rels" ADD CONSTRAINT "registrations_rels_player_documents_fk" FOREIGN KEY ("player_documents_id") REFERENCES "public"."player_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "members" ADD CONSTRAINT "members_player_record_id_registrations_id_fk" FOREIGN KEY ("player_record_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_last_modified_by_id_users_id_fk" FOREIGN KEY ("last_modified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "financial_summaries" ADD CONSTRAINT "financial_summaries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "financial_summaries" ADD CONSTRAINT "financial_summaries_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_appointed_by_id_users_id_fk" FOREIGN KEY ("appointed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_ended_by_id_users_id_fk" FOREIGN KEY ("ended_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "conservators" ADD CONSTRAINT "conservators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "conservators" ADD CONSTRAINT "conservators_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "conservators" ADD CONSTRAINT "conservators_appointed_by_id_users_id_fk" FOREIGN KEY ("appointed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "conservators" ADD CONSTRAINT "conservators_ended_by_id_users_id_fk" FOREIGN KEY ("ended_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mentors" ADD CONSTRAINT "mentors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mentors" ADD CONSTRAINT "mentors_appointed_by_id_users_id_fk" FOREIGN KEY ("appointed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mentors" ADD CONSTRAINT "mentors_ended_by_id_users_id_fk" FOREIGN KEY ("ended_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_positions" ADD CONSTRAINT "users_positions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "registrations_rels_order_idx" ON "registrations_rels" USING btree ("order");
  CREATE INDEX "registrations_rels_parent_idx" ON "registrations_rels" USING btree ("parent_id");
  CREATE INDEX "registrations_rels_path_idx" ON "registrations_rels" USING btree ("path");
  CREATE INDEX "registrations_rels_player_documents_id_idx" ON "registrations_rels" USING btree ("player_documents_id");
  CREATE INDEX "members_membership_status_idx" ON "members" USING btree ("membership_status");
  CREATE INDEX "members_user_idx" ON "members" USING btree ("user_id");
  CREATE INDEX "members_player_record_idx" ON "members" USING btree ("player_record_id");
  CREATE INDEX "members_archived_idx" ON "members" USING btree ("archived");
  CREATE INDEX "members_updated_at_idx" ON "members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "members" USING btree ("created_at");
  CREATE INDEX "player_documents_updated_at_idx" ON "player_documents" USING btree ("updated_at");
  CREATE INDEX "player_documents_created_at_idx" ON "player_documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "player_documents_filename_idx" ON "player_documents" USING btree ("filename");
  CREATE INDEX "announcements_featured_image_idx" ON "announcements" USING btree ("featured_image_id");
  CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("status");
  CREATE INDEX "announcements_published_at_idx" ON "announcements" USING btree ("published_at");
  CREATE INDEX "announcements_created_by_idx" ON "announcements" USING btree ("created_by_id");
  CREATE INDEX "announcements_last_modified_by_idx" ON "announcements" USING btree ("last_modified_by_id");
  CREATE INDEX "announcements_published_by_idx" ON "announcements" USING btree ("published_by_id");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE INDEX "financial_summaries_period_start_idx" ON "financial_summaries" USING btree ("period_start");
  CREATE INDEX "financial_summaries_created_by_idx" ON "financial_summaries" USING btree ("created_by_id");
  CREATE INDEX "financial_summaries_updated_by_idx" ON "financial_summaries" USING btree ("updated_by_id");
  CREATE INDEX "financial_summaries_updated_at_idx" ON "financial_summaries" USING btree ("updated_at");
  CREATE INDEX "financial_summaries_created_at_idx" ON "financial_summaries" USING btree ("created_at");
  CREATE INDEX "committee_members_position_idx" ON "committee_members" USING btree ("position");
  CREATE INDEX "committee_members_status_idx" ON "committee_members" USING btree ("status");
  CREATE INDEX "committee_members_user_idx" ON "committee_members" USING btree ("user_id");
  CREATE INDEX "committee_members_photo_idx" ON "committee_members" USING btree ("photo_id");
  CREATE INDEX "committee_members_appointed_by_idx" ON "committee_members" USING btree ("appointed_by_id");
  CREATE INDEX "committee_members_ended_by_idx" ON "committee_members" USING btree ("ended_by_id");
  CREATE INDEX "committee_members_updated_at_idx" ON "committee_members" USING btree ("updated_at");
  CREATE INDEX "committee_members_created_at_idx" ON "committee_members" USING btree ("created_at");
  CREATE INDEX "conservators_status_idx" ON "conservators" USING btree ("status");
  CREATE INDEX "conservators_user_idx" ON "conservators" USING btree ("user_id");
  CREATE INDEX "conservators_photo_idx" ON "conservators" USING btree ("photo_id");
  CREATE INDEX "conservators_appointed_by_idx" ON "conservators" USING btree ("appointed_by_id");
  CREATE INDEX "conservators_ended_by_idx" ON "conservators" USING btree ("ended_by_id");
  CREATE INDEX "conservators_updated_at_idx" ON "conservators" USING btree ("updated_at");
  CREATE INDEX "conservators_created_at_idx" ON "conservators" USING btree ("created_at");
  CREATE INDEX "mentors_status_idx" ON "mentors" USING btree ("status");
  CREATE INDEX "mentors_user_idx" ON "mentors" USING btree ("user_id");
  CREATE INDEX "mentors_photo_idx" ON "mentors" USING btree ("photo_id");
  CREATE INDEX "mentors_appointed_by_idx" ON "mentors" USING btree ("appointed_by_id");
  CREATE INDEX "mentors_ended_by_idx" ON "mentors" USING btree ("ended_by_id");
  CREATE INDEX "mentors_updated_at_idx" ON "mentors" USING btree ("updated_at");
  CREATE INDEX "mentors_created_at_idx" ON "mentors" USING btree ("created_at");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_target_collection_idx" ON "audit_logs" USING btree ("target_collection");
  CREATE INDEX "audit_logs_record_id_idx" ON "audit_logs" USING btree ("record_id");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_positions_order_idx" ON "users_positions" USING btree ("order");
  CREATE INDEX "users_positions_parent_idx" ON "users_positions" USING btree ("parent_id");
  ALTER TABLE "players" ADD CONSTRAINT "players_record_id_registrations_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "players" ADD CONSTRAINT "players_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "registrations" ADD CONSTRAINT "registrations_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_player_documents_fk" FOREIGN KEY ("player_documents_id") REFERENCES "public"."player_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_financial_summaries_fk" FOREIGN KEY ("financial_summaries_id") REFERENCES "public"."financial_summaries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_committee_members_fk" FOREIGN KEY ("committee_members_id") REFERENCES "public"."committee_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_conservators_fk" FOREIGN KEY ("conservators_id") REFERENCES "public"."conservators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mentors_fk" FOREIGN KEY ("mentors_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "players_publication_status_idx" ON "players" USING btree ("publication_status");
  CREATE INDEX "players_record_idx" ON "players" USING btree ("record_id");
  CREATE INDEX "players_published_by_idx" ON "players" USING btree ("published_by_id");
  CREATE INDEX "registrations_application_status_idx" ON "registrations" USING btree ("application_status");
  CREATE INDEX "registrations_user_idx" ON "registrations" USING btree ("user_id");
  CREATE INDEX "registrations_reviewed_by_idx" ON "registrations" USING btree ("reviewed_by_id");
  CREATE INDEX "registrations_approved_by_idx" ON "registrations" USING btree ("approved_by_id");
  CREATE INDEX "registrations_submitted_by_idx" ON "registrations" USING btree ("submitted_by_id");
  CREATE INDEX "registrations_archived_idx" ON "registrations" USING btree ("archived");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_locked_documents_rels_player_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("player_documents_id");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");
  CREATE INDEX "payload_locked_documents_rels_financial_summaries_id_idx" ON "payload_locked_documents_rels" USING btree ("financial_summaries_id");
  CREATE INDEX "payload_locked_documents_rels_committee_members_id_idx" ON "payload_locked_documents_rels" USING btree ("committee_members_id");
  CREATE INDEX "payload_locked_documents_rels_conservators_id_idx" ON "payload_locked_documents_rels" USING btree ("conservators_id");
  CREATE INDEX "payload_locked_documents_rels_mentors_id_idx" ON "payload_locked_documents_rels" USING btree ("mentors_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registrations_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "player_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "announcements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "financial_summaries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "committee_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "conservators" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mentors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_positions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "registrations_rels" CASCADE;
  DROP TABLE "members" CASCADE;
  DROP TABLE "player_documents" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "financial_summaries" CASCADE;
  DROP TABLE "committee_members" CASCADE;
  DROP TABLE "conservators" CASCADE;
  DROP TABLE "mentors" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_positions" CASCADE;
  ALTER TABLE "registrations" DROP CONSTRAINT "registrations_user_id_users_id_fk";
  
  ALTER TABLE "registrations" DROP CONSTRAINT "registrations_reviewed_by_id_users_id_fk";
  
  ALTER TABLE "registrations" DROP CONSTRAINT "registrations_approved_by_id_users_id_fk";
  
  ALTER TABLE "registrations" DROP CONSTRAINT "registrations_submitted_by_id_users_id_fk";
  
  ALTER TABLE "players" DROP CONSTRAINT "players_record_id_registrations_id_fk";
  
  ALTER TABLE "players" DROP CONSTRAINT "players_published_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_members_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_player_documents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_announcements_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_financial_summaries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_committee_members_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_conservators_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mentors_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_logs_fk";
  
  DROP INDEX "registrations_application_status_idx";
  DROP INDEX "registrations_user_idx";
  DROP INDEX "registrations_reviewed_by_idx";
  DROP INDEX "registrations_approved_by_idx";
  DROP INDEX "registrations_submitted_by_idx";
  DROP INDEX "registrations_archived_idx";
  DROP INDEX "players_publication_status_idx";
  DROP INDEX "players_record_idx";
  DROP INDEX "players_published_by_idx";
  DROP INDEX "payload_locked_documents_rels_members_id_idx";
  DROP INDEX "payload_locked_documents_rels_player_documents_id_idx";
  DROP INDEX "payload_locked_documents_rels_announcements_id_idx";
  DROP INDEX "payload_locked_documents_rels_financial_summaries_id_idx";
  DROP INDEX "payload_locked_documents_rels_committee_members_id_idx";
  DROP INDEX "payload_locked_documents_rels_conservators_id_idx";
  DROP INDEX "payload_locked_documents_rels_mentors_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "registrations" DROP COLUMN "application_status";
  ALTER TABLE "registrations" DROP COLUMN "membership_status";
  ALTER TABLE "registrations" DROP COLUMN "user_id";
  ALTER TABLE "registrations" DROP COLUMN "changes_requested";
  ALTER TABLE "registrations" DROP COLUMN "player_response";
  ALTER TABLE "registrations" DROP COLUMN "resubmitted_at";
  ALTER TABLE "registrations" DROP COLUMN "review_notes";
  ALTER TABLE "registrations" DROP COLUMN "rejection_reason";
  ALTER TABLE "registrations" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "registrations" DROP COLUMN "reviewed_at";
  ALTER TABLE "registrations" DROP COLUMN "approved_by_id";
  ALTER TABLE "registrations" DROP COLUMN "approved_at";
  ALTER TABLE "registrations" DROP COLUMN "submitted_by_id";
  ALTER TABLE "registrations" DROP COLUMN "archived";
  ALTER TABLE "players" DROP COLUMN "publication_status";
  ALTER TABLE "players" DROP COLUMN "record_id";
  ALTER TABLE "players" DROP COLUMN "published_at";
  ALTER TABLE "players" DROP COLUMN "published_by_id";
  ALTER TABLE "users" DROP COLUMN "account_status";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "members_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "player_documents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "announcements_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "financial_summaries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "committee_members_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "conservators_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mentors_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_logs_id";
  DROP TYPE "public"."enum_registrations_application_status";
  DROP TYPE "public"."enum_registrations_membership_status";
  DROP TYPE "public"."enum_players_publication_status";
  DROP TYPE "public"."enum_members_membership_type";
  DROP TYPE "public"."enum_members_membership_status";
  DROP TYPE "public"."enum_announcements_category";
  DROP TYPE "public"."enum_announcements_status";
  DROP TYPE "public"."enum_committee_members_position";
  DROP TYPE "public"."enum_committee_members_status";
  DROP TYPE "public"."enum_conservators_status";
  DROP TYPE "public"."enum_mentors_status";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_positions";
  DROP TYPE "public"."enum_users_account_status";`)
}
