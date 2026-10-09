import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_matches_scorers_side" AS ENUM('us', 'them');
  CREATE TYPE "public"."enum_matches_home_or_away" AS ENUM('home', 'away');
  CREATE TYPE "public"."enum_matches_match_status" AS ENUM('scheduled', 'live', 'fulltime', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum_matches_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__matches_v_version_scorers_side" AS ENUM('us', 'them');
  CREATE TYPE "public"."enum__matches_v_version_home_or_away" AS ENUM('home', 'away');
  CREATE TYPE "public"."enum__matches_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_players_position" AS ENUM('goalkeeper', 'defender', 'midfielder', 'forward');
  CREATE TYPE "public"."enum_posts_category" AS ENUM('match-report', 'club-news', 'trials', 'sponsor-news');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_category" AS ENUM('match-report', 'club-news', 'trials', 'sponsor-news');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_media_type" AS ENUM('image', 'video');
  CREATE TYPE "public"."enum_applications_status" AS ENUM('new', 'contacted', 'trial-booked', 'joined', 'declined');
  CREATE TYPE "public"."enum_applications_preferred_position" AS ENUM('gk', 'defender', 'midfielder', 'forward', 'not-sure');
  CREATE TYPE "public"."enum_applications_experience_level" AS ENUM('beginner', 'club', 'academy-state', 'other');
  CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'in-progress', 'closed');
  CREATE TYPE "public"."enum_enquiries_type" AS ENUM('general', 'match', 'sponsor', 'media');
  CREATE TYPE "public"."enum_enquiries_interest" AS ENUM('shirt', 'kit', 'event', 'equipment', 'other');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_site_settings_socials_network" AS ENUM('instagram', 'facebook', 'youtube', 'x', 'whatsapp');
  CREATE TABLE "matches_scorers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"minute" numeric,
  	"side" "enum_matches_scorers_side" DEFAULT 'us'
  );
  
  CREATE TABLE "matches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"opponent_name" varchar,
  	"home_or_away" "enum_matches_home_or_away" DEFAULT 'home',
  	"kickoff_utc" timestamp(3) with time zone,
  	"slug" varchar,
  	"competition" varchar,
  	"venue_name" varchar,
  	"venue_map_url" varchar,
  	"opponent_crest_id" integer,
  	"status" "enum_matches_match_status" DEFAULT 'scheduled',
  	"score_for" numeric,
  	"score_against" numeric,
  	"report_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_matches_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "matches_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_matches_v_version_scorers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"minute" numeric,
  	"side" "enum__matches_v_version_scorers_side" DEFAULT 'us',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_matches_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_opponent_name" varchar,
  	"version_home_or_away" "enum__matches_v_version_home_or_away" DEFAULT 'home',
  	"version_kickoff_utc" timestamp(3) with time zone,
  	"version_slug" varchar,
  	"version_competition" varchar,
  	"version_venue_name" varchar,
  	"version_venue_map_url" varchar,
  	"version_opponent_crest_id" integer,
  	"version_status" "enum_matches_match_status" DEFAULT 'scheduled',
  	"version_score_for" numeric,
  	"version_score_against" numeric,
  	"version_report_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__matches_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_matches_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "players" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"shirt_number" numeric,
  	"position" "enum_players_position" NOT NULL,
  	"slug" varchar,
  	"consent_on_file" boolean DEFAULT false,
  	"photo_id" integer,
  	"bio" varchar,
  	"date_of_birth" timestamp(3) with time zone,
  	"show_age" boolean DEFAULT false,
  	"nationality" varchar,
  	"stats_appearances" numeric,
  	"stats_goals" numeric,
  	"stats_assists" numeric,
  	"social_handle" varchar,
  	"is_active" boolean DEFAULT true,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "players_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "staff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"photo_id" integer,
  	"bio" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sponsors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer NOT NULL,
  	"logo_on_white" boolean DEFAULT false,
  	"url" varchar,
  	"tier" varchar,
  	"permission_on_file" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"category" "enum_posts_category" DEFAULT 'club-news',
  	"cover_image_id" integer,
  	"excerpt" varchar,
  	"body" jsonb,
  	"author_name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_category" "enum__posts_v_version_category" DEFAULT 'club-news',
  	"version_cover_image_id" integer,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_author_name" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"type" "enum_media_type" DEFAULT 'image' NOT NULL,
  	"video_url" varchar,
  	"caption" varchar,
  	"credit" varchar,
  	"album" varchar,
  	"show_in_gallery" boolean DEFAULT false,
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
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_applications_status" DEFAULT 'new' NOT NULL,
  	"full_name" varchar NOT NULL,
  	"date_of_birth" timestamp(3) with time zone NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"preferred_position" "enum_applications_preferred_position",
  	"experience_level" "enum_applications_experience_level",
  	"previous_club" varchar,
  	"preferred_trial_date" varchar,
  	"message" varchar,
  	"guardian_name" varchar,
  	"guardian_phone" varchar,
  	"is_minor" boolean,
  	"consent" boolean DEFAULT false NOT NULL,
  	"notes" varchar,
  	"fingerprint" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_enquiries_status" DEFAULT 'new' NOT NULL,
  	"type" "enum_enquiries_type" NOT NULL,
  	"name" varchar NOT NULL,
  	"business_name" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"interest" "enum_enquiries_interest",
  	"message" varchar,
  	"notes" varchar,
  	"fingerprint" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "rate_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'applications' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
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
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
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
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"matches_id" integer,
  	"players_id" integer,
  	"staff_id" integer,
  	"sponsors_id" integer,
  	"posts_id" integer,
  	"media_id" integer,
  	"applications_id" integer,
  	"enquiries_id" integer,
  	"users_id" integer,
  	"rate_limits_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "site_settings_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"network" "enum_site_settings_socials_network" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_placement_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tagline" varchar,
  	"hero_headline" varchar,
  	"hero_lead" varchar,
  	"hero_image_id" integer,
  	"club_intro" varchar,
  	"intro_image_id" integer,
  	"join_cta_text" varchar,
  	"club_story" varchar,
  	"story_image_id" integer,
  	"founding_year" numeric,
  	"home_ground" varchar,
  	"badge_meaning" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"address" varchar,
  	"map_url" varchar,
  	"map_image_id" integer,
  	"notification_email" varchar,
  	"sponsor_pitch" varchar,
  	"retention_period" varchar,
  	"privacy_contact" varchar,
  	"privacy_last_updated" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "join_page_trial_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start" timestamp(3) with time zone NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "join_page_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "join_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"who_can_join" varchar,
  	"age_groups" varchar,
  	"trial_location" varchar,
  	"trial_location_map_url" varchar,
  	"what_to_bring" varchar,
  	"fees" varchar,
  	"response_time" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "matches_scorers" ADD CONSTRAINT "matches_scorers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "matches" ADD CONSTRAINT "matches_opponent_crest_id_media_id_fk" FOREIGN KEY ("opponent_crest_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "matches" ADD CONSTRAINT "matches_report_id_posts_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "matches_rels" ADD CONSTRAINT "matches_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "matches_rels" ADD CONSTRAINT "matches_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_matches_v_version_scorers" ADD CONSTRAINT "_matches_v_version_scorers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_matches_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_parent_id_matches_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_version_opponent_crest_id_media_id_fk" FOREIGN KEY ("version_opponent_crest_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_matches_v" ADD CONSTRAINT "_matches_v_version_report_id_posts_id_fk" FOREIGN KEY ("version_report_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_matches_v_rels" ADD CONSTRAINT "_matches_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_matches_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_matches_v_rels" ADD CONSTRAINT "_matches_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "players" ADD CONSTRAINT "players_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "players_rels" ADD CONSTRAINT "players_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "players_rels" ADD CONSTRAINT "players_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "staff" ADD CONSTRAINT "staff_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_matches_fk" FOREIGN KEY ("matches_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_players_fk" FOREIGN KEY ("players_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sponsors_fk" FOREIGN KEY ("sponsors_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applications_fk" FOREIGN KEY ("applications_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limits_fk" FOREIGN KEY ("rate_limits_id") REFERENCES "public"."rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_values" ADD CONSTRAINT "site_settings_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_timeline" ADD CONSTRAINT "site_settings_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_placement_options" ADD CONSTRAINT "site_settings_placement_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_story_image_id_media_id_fk" FOREIGN KEY ("story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_map_image_id_media_id_fk" FOREIGN KEY ("map_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "join_page_trial_dates" ADD CONSTRAINT "join_page_trial_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."join_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "join_page_faq" ADD CONSTRAINT "join_page_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."join_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "matches_scorers_order_idx" ON "matches_scorers" USING btree ("_order");
  CREATE INDEX "matches_scorers_parent_id_idx" ON "matches_scorers" USING btree ("_parent_id");
  CREATE INDEX "matches_kickoff_utc_idx" ON "matches" USING btree ("kickoff_utc");
  CREATE UNIQUE INDEX "matches_slug_idx" ON "matches" USING btree ("slug");
  CREATE INDEX "matches_opponent_crest_idx" ON "matches" USING btree ("opponent_crest_id");
  CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");
  CREATE INDEX "matches_report_idx" ON "matches" USING btree ("report_id");
  CREATE INDEX "matches_updated_at_idx" ON "matches" USING btree ("updated_at");
  CREATE INDEX "matches_created_at_idx" ON "matches" USING btree ("created_at");
  CREATE INDEX "matches__status_idx" ON "matches" USING btree ("_status");
  CREATE INDEX "matches_rels_order_idx" ON "matches_rels" USING btree ("order");
  CREATE INDEX "matches_rels_parent_idx" ON "matches_rels" USING btree ("parent_id");
  CREATE INDEX "matches_rels_path_idx" ON "matches_rels" USING btree ("path");
  CREATE INDEX "matches_rels_media_id_idx" ON "matches_rels" USING btree ("media_id");
  CREATE INDEX "_matches_v_version_scorers_order_idx" ON "_matches_v_version_scorers" USING btree ("_order");
  CREATE INDEX "_matches_v_version_scorers_parent_id_idx" ON "_matches_v_version_scorers" USING btree ("_parent_id");
  CREATE INDEX "_matches_v_parent_idx" ON "_matches_v" USING btree ("parent_id");
  CREATE INDEX "_matches_v_version_version_kickoff_utc_idx" ON "_matches_v" USING btree ("version_kickoff_utc");
  CREATE INDEX "_matches_v_version_version_slug_idx" ON "_matches_v" USING btree ("version_slug");
  CREATE INDEX "_matches_v_version_version_opponent_crest_idx" ON "_matches_v" USING btree ("version_opponent_crest_id");
  CREATE INDEX "_matches_v_version_version_status_idx" ON "_matches_v" USING btree ("version_status");
  CREATE INDEX "_matches_v_version_version_report_idx" ON "_matches_v" USING btree ("version_report_id");
  CREATE INDEX "_matches_v_version_version_updated_at_idx" ON "_matches_v" USING btree ("version_updated_at");
  CREATE INDEX "_matches_v_version_version_created_at_idx" ON "_matches_v" USING btree ("version_created_at");
  CREATE INDEX "_matches_v_version_version__status_idx" ON "_matches_v" USING btree ("version__status");
  CREATE INDEX "_matches_v_created_at_idx" ON "_matches_v" USING btree ("created_at");
  CREATE INDEX "_matches_v_updated_at_idx" ON "_matches_v" USING btree ("updated_at");
  CREATE INDEX "_matches_v_latest_idx" ON "_matches_v" USING btree ("latest");
  CREATE INDEX "_matches_v_rels_order_idx" ON "_matches_v_rels" USING btree ("order");
  CREATE INDEX "_matches_v_rels_parent_idx" ON "_matches_v_rels" USING btree ("parent_id");
  CREATE INDEX "_matches_v_rels_path_idx" ON "_matches_v_rels" USING btree ("path");
  CREATE INDEX "_matches_v_rels_media_id_idx" ON "_matches_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "players_slug_idx" ON "players" USING btree ("slug");
  CREATE INDEX "players_photo_idx" ON "players" USING btree ("photo_id");
  CREATE INDEX "players_updated_at_idx" ON "players" USING btree ("updated_at");
  CREATE INDEX "players_created_at_idx" ON "players" USING btree ("created_at");
  CREATE INDEX "players_rels_order_idx" ON "players_rels" USING btree ("order");
  CREATE INDEX "players_rels_parent_idx" ON "players_rels" USING btree ("parent_id");
  CREATE INDEX "players_rels_path_idx" ON "players_rels" USING btree ("path");
  CREATE INDEX "players_rels_media_id_idx" ON "players_rels" USING btree ("media_id");
  CREATE INDEX "staff_photo_idx" ON "staff" USING btree ("photo_id");
  CREATE INDEX "staff_updated_at_idx" ON "staff" USING btree ("updated_at");
  CREATE INDEX "staff_created_at_idx" ON "staff" USING btree ("created_at");
  CREATE INDEX "sponsors_logo_idx" ON "sponsors" USING btree ("logo_id");
  CREATE INDEX "sponsors_updated_at_idx" ON "sponsors" USING btree ("updated_at");
  CREATE INDEX "sponsors_created_at_idx" ON "sponsors" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at");
  CREATE INDEX "posts_cover_image_idx" ON "posts" USING btree ("cover_image_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_published_at_idx" ON "_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_posts_v_version_version_cover_image_idx" ON "_posts_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "media_album_idx" ON "media" USING btree ("album");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");
  CREATE INDEX "applications_fingerprint_idx" ON "applications" USING btree ("fingerprint");
  CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");
  CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");
  CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");
  CREATE INDEX "enquiries_type_idx" ON "enquiries" USING btree ("type");
  CREATE INDEX "enquiries_fingerprint_idx" ON "enquiries" USING btree ("fingerprint");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "rate_limits_key_idx" ON "rate_limits" USING btree ("key");
  CREATE INDEX "rate_limits_updated_at_idx" ON "rate_limits" USING btree ("updated_at");
  CREATE INDEX "rate_limits_created_at_idx" ON "rate_limits" USING btree ("created_at");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_matches_id_idx" ON "payload_locked_documents_rels" USING btree ("matches_id");
  CREATE INDEX "payload_locked_documents_rels_players_id_idx" ON "payload_locked_documents_rels" USING btree ("players_id");
  CREATE INDEX "payload_locked_documents_rels_staff_id_idx" ON "payload_locked_documents_rels" USING btree ("staff_id");
  CREATE INDEX "payload_locked_documents_rels_sponsors_id_idx" ON "payload_locked_documents_rels" USING btree ("sponsors_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("applications_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limits_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_values_order_idx" ON "site_settings_values" USING btree ("_order");
  CREATE INDEX "site_settings_values_parent_id_idx" ON "site_settings_values" USING btree ("_parent_id");
  CREATE INDEX "site_settings_timeline_order_idx" ON "site_settings_timeline" USING btree ("_order");
  CREATE INDEX "site_settings_timeline_parent_id_idx" ON "site_settings_timeline" USING btree ("_parent_id");
  CREATE INDEX "site_settings_socials_order_idx" ON "site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_placement_options_order_idx" ON "site_settings_placement_options" USING btree ("_order");
  CREATE INDEX "site_settings_placement_options_parent_id_idx" ON "site_settings_placement_options" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hero_image_idx" ON "site_settings" USING btree ("hero_image_id");
  CREATE INDEX "site_settings_intro_image_idx" ON "site_settings" USING btree ("intro_image_id");
  CREATE INDEX "site_settings_story_image_idx" ON "site_settings" USING btree ("story_image_id");
  CREATE INDEX "site_settings_map_image_idx" ON "site_settings" USING btree ("map_image_id");
  CREATE INDEX "join_page_trial_dates_order_idx" ON "join_page_trial_dates" USING btree ("_order");
  CREATE INDEX "join_page_trial_dates_parent_id_idx" ON "join_page_trial_dates" USING btree ("_parent_id");
  CREATE INDEX "join_page_faq_order_idx" ON "join_page_faq" USING btree ("_order");
  CREATE INDEX "join_page_faq_parent_id_idx" ON "join_page_faq" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "matches_scorers" CASCADE;
  DROP TABLE "matches" CASCADE;
  DROP TABLE "matches_rels" CASCADE;
  DROP TABLE "_matches_v_version_scorers" CASCADE;
  DROP TABLE "_matches_v" CASCADE;
  DROP TABLE "_matches_v_rels" CASCADE;
  DROP TABLE "players" CASCADE;
  DROP TABLE "players_rels" CASCADE;
  DROP TABLE "staff" CASCADE;
  DROP TABLE "sponsors" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "applications" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "rate_limits" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_values" CASCADE;
  DROP TABLE "site_settings_timeline" CASCADE;
  DROP TABLE "site_settings_socials" CASCADE;
  DROP TABLE "site_settings_placement_options" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "join_page_trial_dates" CASCADE;
  DROP TABLE "join_page_faq" CASCADE;
  DROP TABLE "join_page" CASCADE;
  DROP TYPE "public"."enum_matches_scorers_side";
  DROP TYPE "public"."enum_matches_home_or_away";
  DROP TYPE "public"."enum_matches_match_status";
  DROP TYPE "public"."enum_matches_status";
  DROP TYPE "public"."enum__matches_v_version_scorers_side";
  DROP TYPE "public"."enum__matches_v_version_home_or_away";
  DROP TYPE "public"."enum__matches_v_version_status";
  DROP TYPE "public"."enum_players_position";
  DROP TYPE "public"."enum_posts_category";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_category";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_media_type";
  DROP TYPE "public"."enum_applications_status";
  DROP TYPE "public"."enum_applications_preferred_position";
  DROP TYPE "public"."enum_applications_experience_level";
  DROP TYPE "public"."enum_enquiries_status";
  DROP TYPE "public"."enum_enquiries_type";
  DROP TYPE "public"."enum_enquiries_interest";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_site_settings_socials_network";`)
}
