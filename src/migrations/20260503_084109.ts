import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_study_session_questions_answers_type" AS ENUM('unanswered', 'multipleChoice', 'shortText', 'selfReport');
  CREATE TYPE "public"."enum_study_session_questions_status" AS ENUM('notStarted', 'skipped', 'answered');
  CREATE TYPE "public"."enum_study_session_state" AS ENUM('notStarted', 'started', 'finished');
  CREATE TABLE "study_session_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"part_id" varchar NOT NULL,
  	"type" "enum_study_session_questions_answers_type" NOT NULL,
  	"multiple_choice_choice_id" varchar,
  	"short_text_answer" varchar,
  	"self_report_answer" boolean
  );
  
  CREATE TABLE "study_session_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_id" integer NOT NULL,
  	"question_version_id" varchar NOT NULL,
  	"status" "enum_study_session_questions_status" DEFAULT 'notStarted' NOT NULL,
  	"flagged" boolean DEFAULT false NOT NULL,
  	"answered_at" timestamp(3) with time zone,
  	"skipped_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "study_session" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"state" "enum_study_session_state" DEFAULT 'started' NOT NULL,
  	"begun_at" timestamp(3) with time zone,
  	"ended_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "sub_topic" DROP CONSTRAINT "sub_topic_topic_id_topic_id_fk";
  
  ALTER TABLE "syllabus_sub_topic" DROP CONSTRAINT "syllabus_sub_topic_syllabus_id_syllabus_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "study_session_id" integer;
  ALTER TABLE "study_session_questions_answers" ADD CONSTRAINT "study_session_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_session_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_session_questions" ADD CONSTRAINT "study_session_questions_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "study_session_questions" ADD CONSTRAINT "study_session_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_session"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_session" ADD CONSTRAINT "study_session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "study_session_questions_answers_order_idx" ON "study_session_questions_answers" USING btree ("_order");
  CREATE INDEX "study_session_questions_answers_parent_id_idx" ON "study_session_questions_answers" USING btree ("_parent_id");
  CREATE INDEX "study_session_questions_order_idx" ON "study_session_questions" USING btree ("_order");
  CREATE INDEX "study_session_questions_parent_id_idx" ON "study_session_questions" USING btree ("_parent_id");
  CREATE INDEX "study_session_questions_question_idx" ON "study_session_questions" USING btree ("question_id");
  CREATE INDEX "study_session_user_idx" ON "study_session" USING btree ("user_id");
  CREATE INDEX "study_session_updated_at_idx" ON "study_session" USING btree ("updated_at");
  CREATE INDEX "study_session_created_at_idx" ON "study_session" USING btree ("created_at");
  ALTER TABLE "sub_topic" ADD CONSTRAINT "sub_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "syllabus_sub_topic" ADD CONSTRAINT "syllabus_sub_topic_syllabus_id_syllabus_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_study_session_fk" FOREIGN KEY ("study_session_id") REFERENCES "public"."study_session"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_study_session_id_idx" ON "payload_locked_documents_rels" USING btree ("study_session_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "study_session_questions_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "study_session_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "study_session" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "study_session_questions_answers" CASCADE;
  DROP TABLE "study_session_questions" CASCADE;
  DROP TABLE "study_session" CASCADE;
  ALTER TABLE "sub_topic" DROP CONSTRAINT "sub_topic_topic_id_topic_id_fk";
  
  ALTER TABLE "syllabus_sub_topic" DROP CONSTRAINT "syllabus_sub_topic_syllabus_id_syllabus_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_study_session_fk";
  
  DROP INDEX "payload_locked_documents_rels_study_session_id_idx";
  ALTER TABLE "sub_topic" ADD CONSTRAINT "sub_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "syllabus_sub_topic" ADD CONSTRAINT "syllabus_sub_topic_syllabus_id_syllabus_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "study_session_id";
  DROP TYPE "public"."enum_study_session_questions_answers_type";
  DROP TYPE "public"."enum_study_session_questions_status";
  DROP TYPE "public"."enum_study_session_state";`)
}
