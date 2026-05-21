import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'student');
  CREATE TYPE "public"."enum_syllabus_sub_topic_status" AS ENUM('included', 'assumedKnowledge');
  CREATE TYPE "public"."enum_q_parts_response_type" AS ENUM('multipleChoice', 'shortText', 'selfReport');
  CREATE TYPE "public"."enum_question_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__q_parts_v_response_type" AS ENUM('multipleChoice', 'shortText', 'selfReport');
  CREATE TYPE "public"."enum__question_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_study_session_questions_answers_type" AS ENUM('unanswered', 'multipleChoice', 'shortText', 'selfReport');
  CREATE TYPE "public"."enum_study_session_questions_status" AS ENUM('notStarted', 'skipped', 'answered');
  CREATE TYPE "public"."enum_study_session_state" AS ENUM('notStarted', 'started', 'finished');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_users_roles",
  	"id" uuid PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
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
  
  CREATE TABLE "topic" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sub_topic" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"topic_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "syllabus" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "syllabus_sub_topic" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"syllabus_id" uuid NOT NULL,
  	"sub_topic_id" uuid NOT NULL,
  	"status" "enum_syllabus_sub_topic_status" DEFAULT 'included' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mc_choices" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false
  );
  
  CREATE TABLE "short_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "solutions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prompt" jsonb
  );
  
  CREATE TABLE "q_parts" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prompt" jsonb,
  	"response_type" "enum_q_parts_response_type",
  	"response_multiple_choice_shuffle" boolean DEFAULT true
  );
  
  CREATE TABLE "question" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"prompt" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_question_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "question_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"sub_topic_id" uuid
  );
  
  CREATE TABLE "_mc_choices_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_short_answers_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_solutions_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY NOT NULL,
  	"prompt" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_q_parts_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY NOT NULL,
  	"prompt" jsonb,
  	"response_type" "enum__q_parts_v_response_type",
  	"response_multiple_choice_shuffle" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_question_v" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"parent_id" uuid,
  	"version_prompt" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__question_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_question_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"sub_topic_id" uuid
  );
  
  CREATE TABLE "study_session_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"part_id" varchar,
  	"type" "enum_study_session_questions_answers_type",
  	"multiple_choice_choice_id" varchar,
  	"short_text_answer" varchar,
  	"self_report_answer" boolean
  );
  
  CREATE TABLE "study_session_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_id" uuid NOT NULL,
  	"question_version_id" varchar,
  	"status" "enum_study_session_questions_status" DEFAULT 'notStarted' NOT NULL,
  	"flagged" boolean DEFAULT false NOT NULL,
  	"answered_at" timestamp(3) with time zone,
  	"skipped_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "study_session" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"state" "enum_study_session_state" DEFAULT 'started',
  	"begun_at" timestamp(3) with time zone,
  	"ended_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"media_id" uuid,
  	"topic_id" uuid,
  	"sub_topic_id" uuid,
  	"syllabus_id" uuid,
  	"syllabus_sub_topic_id" uuid,
  	"question_id" uuid,
  	"study_session_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sub_topic" ADD CONSTRAINT "sub_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "syllabus_sub_topic" ADD CONSTRAINT "syllabus_sub_topic_syllabus_id_syllabus_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "syllabus_sub_topic" ADD CONSTRAINT "syllabus_sub_topic_sub_topic_id_sub_topic_id_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mc_choices" ADD CONSTRAINT "mc_choices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."q_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "short_answers" ADD CONSTRAINT "short_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."q_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solutions" ADD CONSTRAINT "solutions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."q_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "q_parts" ADD CONSTRAINT "q_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_rels" ADD CONSTRAINT "question_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_rels" ADD CONSTRAINT "question_rels_sub_topic_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mc_choices_v" ADD CONSTRAINT "_mc_choices_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_q_parts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_short_answers_v" ADD CONSTRAINT "_short_answers_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_q_parts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_q_parts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_q_parts_v" ADD CONSTRAINT "_q_parts_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v" ADD CONSTRAINT "_question_v_parent_id_question_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_question_v_rels" ADD CONSTRAINT "_question_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_rels" ADD CONSTRAINT "_question_v_rels_sub_topic_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_session_questions_answers" ADD CONSTRAINT "study_session_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_session_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_session_questions" ADD CONSTRAINT "study_session_questions_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "study_session_questions" ADD CONSTRAINT "study_session_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_session"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_session" ADD CONSTRAINT "study_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topic_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sub_topic_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_syllabus_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_syllabus_sub_topic_fk" FOREIGN KEY ("syllabus_sub_topic_id") REFERENCES "public"."syllabus_sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_question_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_study_session_fk" FOREIGN KEY ("study_session_id") REFERENCES "public"."study_session"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "topic_updated_at_idx" ON "topic" USING btree ("updated_at");
  CREATE INDEX "topic_created_at_idx" ON "topic" USING btree ("created_at");
  CREATE INDEX "sub_topic_topic_idx" ON "sub_topic" USING btree ("topic_id");
  CREATE INDEX "sub_topic_updated_at_idx" ON "sub_topic" USING btree ("updated_at");
  CREATE INDEX "sub_topic_created_at_idx" ON "sub_topic" USING btree ("created_at");
  CREATE UNIQUE INDEX "syllabus_name_idx" ON "syllabus" USING btree ("name");
  CREATE INDEX "syllabus_updated_at_idx" ON "syllabus" USING btree ("updated_at");
  CREATE INDEX "syllabus_created_at_idx" ON "syllabus" USING btree ("created_at");
  CREATE INDEX "syllabus_sub_topic_syllabus_idx" ON "syllabus_sub_topic" USING btree ("syllabus_id");
  CREATE INDEX "syllabus_sub_topic_sub_topic_idx" ON "syllabus_sub_topic" USING btree ("sub_topic_id");
  CREATE INDEX "syllabus_sub_topic_updated_at_idx" ON "syllabus_sub_topic" USING btree ("updated_at");
  CREATE INDEX "syllabus_sub_topic_created_at_idx" ON "syllabus_sub_topic" USING btree ("created_at");
  CREATE UNIQUE INDEX "syllabus_subTopic_idx" ON "syllabus_sub_topic" USING btree ("syllabus_id","sub_topic_id");
  CREATE INDEX "mc_choices_order_idx" ON "mc_choices" USING btree ("_order");
  CREATE INDEX "mc_choices_parent_id_idx" ON "mc_choices" USING btree ("_parent_id");
  CREATE INDEX "short_answers_order_idx" ON "short_answers" USING btree ("_order");
  CREATE INDEX "short_answers_parent_id_idx" ON "short_answers" USING btree ("_parent_id");
  CREATE INDEX "solutions_order_idx" ON "solutions" USING btree ("_order");
  CREATE INDEX "solutions_parent_id_idx" ON "solutions" USING btree ("_parent_id");
  CREATE INDEX "q_parts_order_idx" ON "q_parts" USING btree ("_order");
  CREATE INDEX "q_parts_parent_id_idx" ON "q_parts" USING btree ("_parent_id");
  CREATE INDEX "question_updated_at_idx" ON "question" USING btree ("updated_at");
  CREATE INDEX "question_created_at_idx" ON "question" USING btree ("created_at");
  CREATE INDEX "question__status_idx" ON "question" USING btree ("_status");
  CREATE INDEX "question_rels_order_idx" ON "question_rels" USING btree ("order");
  CREATE INDEX "question_rels_parent_idx" ON "question_rels" USING btree ("parent_id");
  CREATE INDEX "question_rels_path_idx" ON "question_rels" USING btree ("path");
  CREATE INDEX "question_rels_sub_topic_id_idx" ON "question_rels" USING btree ("sub_topic_id");
  CREATE INDEX "_mc_choices_v_order_idx" ON "_mc_choices_v" USING btree ("_order");
  CREATE INDEX "_mc_choices_v_parent_id_idx" ON "_mc_choices_v" USING btree ("_parent_id");
  CREATE INDEX "_short_answers_v_order_idx" ON "_short_answers_v" USING btree ("_order");
  CREATE INDEX "_short_answers_v_parent_id_idx" ON "_short_answers_v" USING btree ("_parent_id");
  CREATE INDEX "_solutions_v_order_idx" ON "_solutions_v" USING btree ("_order");
  CREATE INDEX "_solutions_v_parent_id_idx" ON "_solutions_v" USING btree ("_parent_id");
  CREATE INDEX "_q_parts_v_order_idx" ON "_q_parts_v" USING btree ("_order");
  CREATE INDEX "_q_parts_v_parent_id_idx" ON "_q_parts_v" USING btree ("_parent_id");
  CREATE INDEX "_question_v_parent_idx" ON "_question_v" USING btree ("parent_id");
  CREATE INDEX "_question_v_version_version_updated_at_idx" ON "_question_v" USING btree ("version_updated_at");
  CREATE INDEX "_question_v_version_version_created_at_idx" ON "_question_v" USING btree ("version_created_at");
  CREATE INDEX "_question_v_version_version__status_idx" ON "_question_v" USING btree ("version__status");
  CREATE INDEX "_question_v_created_at_idx" ON "_question_v" USING btree ("created_at");
  CREATE INDEX "_question_v_updated_at_idx" ON "_question_v" USING btree ("updated_at");
  CREATE INDEX "_question_v_latest_idx" ON "_question_v" USING btree ("latest");
  CREATE INDEX "_question_v_autosave_idx" ON "_question_v" USING btree ("autosave");
  CREATE INDEX "_question_v_rels_order_idx" ON "_question_v_rels" USING btree ("order");
  CREATE INDEX "_question_v_rels_parent_idx" ON "_question_v_rels" USING btree ("parent_id");
  CREATE INDEX "_question_v_rels_path_idx" ON "_question_v_rels" USING btree ("path");
  CREATE INDEX "_question_v_rels_sub_topic_id_idx" ON "_question_v_rels" USING btree ("sub_topic_id");
  CREATE INDEX "study_session_questions_answers_order_idx" ON "study_session_questions_answers" USING btree ("_order");
  CREATE INDEX "study_session_questions_answers_parent_id_idx" ON "study_session_questions_answers" USING btree ("_parent_id");
  CREATE INDEX "study_session_questions_order_idx" ON "study_session_questions" USING btree ("_order");
  CREATE INDEX "study_session_questions_parent_id_idx" ON "study_session_questions" USING btree ("_parent_id");
  CREATE INDEX "study_session_questions_question_idx" ON "study_session_questions" USING btree ("question_id");
  CREATE INDEX "study_session_user_idx" ON "study_session" USING btree ("user_id");
  CREATE INDEX "study_session_updated_at_idx" ON "study_session" USING btree ("updated_at");
  CREATE INDEX "study_session_created_at_idx" ON "study_session" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_topic_id_idx" ON "payload_locked_documents_rels" USING btree ("topic_id");
  CREATE INDEX "payload_locked_documents_rels_sub_topic_id_idx" ON "payload_locked_documents_rels" USING btree ("sub_topic_id");
  CREATE INDEX "payload_locked_documents_rels_syllabus_id_idx" ON "payload_locked_documents_rels" USING btree ("syllabus_id");
  CREATE INDEX "payload_locked_documents_rels_syllabus_sub_topic_id_idx" ON "payload_locked_documents_rels" USING btree ("syllabus_sub_topic_id");
  CREATE INDEX "payload_locked_documents_rels_question_id_idx" ON "payload_locked_documents_rels" USING btree ("question_id");
  CREATE INDEX "payload_locked_documents_rels_study_session_id_idx" ON "payload_locked_documents_rels" USING btree ("study_session_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "topic" CASCADE;
  DROP TABLE "sub_topic" CASCADE;
  DROP TABLE "syllabus" CASCADE;
  DROP TABLE "syllabus_sub_topic" CASCADE;
  DROP TABLE "mc_choices" CASCADE;
  DROP TABLE "short_answers" CASCADE;
  DROP TABLE "solutions" CASCADE;
  DROP TABLE "q_parts" CASCADE;
  DROP TABLE "question" CASCADE;
  DROP TABLE "question_rels" CASCADE;
  DROP TABLE "_mc_choices_v" CASCADE;
  DROP TABLE "_short_answers_v" CASCADE;
  DROP TABLE "_solutions_v" CASCADE;
  DROP TABLE "_q_parts_v" CASCADE;
  DROP TABLE "_question_v" CASCADE;
  DROP TABLE "_question_v_rels" CASCADE;
  DROP TABLE "study_session_questions_answers" CASCADE;
  DROP TABLE "study_session_questions" CASCADE;
  DROP TABLE "study_session" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_syllabus_sub_topic_status";
  DROP TYPE "public"."enum_q_parts_response_type";
  DROP TYPE "public"."enum_question_status";
  DROP TYPE "public"."enum__q_parts_v_response_type";
  DROP TYPE "public"."enum__question_v_version_status";
  DROP TYPE "public"."enum_study_session_questions_answers_type";
  DROP TYPE "public"."enum_study_session_questions_status";
  DROP TYPE "public"."enum_study_session_state";`)
}
