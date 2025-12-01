import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "question_blocks_self_report" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "question_blocks_free_text_validation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"correct_answer" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "question_blocks_mcq_options" RENAME TO "question_blocks_multiple_choice_answers";
  ALTER TABLE "question_blocks_mcq" RENAME TO "question_blocks_multiple_choice";
  ALTER TABLE "question_blocks_multiple_choice_answers" RENAME COLUMN "text" TO "answer";
  ALTER TABLE "question_blocks_multiple_choice_answers" DROP CONSTRAINT "question_blocks_mcq_options_parent_id_fk";
  
  ALTER TABLE "question_blocks_multiple_choice" DROP CONSTRAINT "question_blocks_mcq_parent_id_fk";
  
  DROP INDEX "question_blocks_mcq_options_order_idx";
  DROP INDEX "question_blocks_mcq_options_parent_id_idx";
  DROP INDEX "question_blocks_mcq_order_idx";
  DROP INDEX "question_blocks_mcq_parent_id_idx";
  DROP INDEX "question_blocks_mcq_path_idx";
  ALTER TABLE "question_blocks_self_report" ADD CONSTRAINT "question_blocks_self_report_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_blocks_free_text_validation" ADD CONSTRAINT "question_blocks_free_text_validation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_blocks_self_report_order_idx" ON "question_blocks_self_report" USING btree ("_order");
  CREATE INDEX "question_blocks_self_report_parent_id_idx" ON "question_blocks_self_report" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_self_report_path_idx" ON "question_blocks_self_report" USING btree ("_path");
  CREATE INDEX "question_blocks_free_text_validation_order_idx" ON "question_blocks_free_text_validation" USING btree ("_order");
  CREATE INDEX "question_blocks_free_text_validation_parent_id_idx" ON "question_blocks_free_text_validation" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_free_text_validation_path_idx" ON "question_blocks_free_text_validation" USING btree ("_path");
  ALTER TABLE "question_blocks_multiple_choice_answers" ADD CONSTRAINT "question_blocks_multiple_choice_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_blocks_multiple_choice"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_blocks_multiple_choice" ADD CONSTRAINT "question_blocks_multiple_choice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_blocks_multiple_choice_answers_order_idx" ON "question_blocks_multiple_choice_answers" USING btree ("_order");
  CREATE INDEX "question_blocks_multiple_choice_answers_parent_id_idx" ON "question_blocks_multiple_choice_answers" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_multiple_choice_order_idx" ON "question_blocks_multiple_choice" USING btree ("_order");
  CREATE INDEX "question_blocks_multiple_choice_parent_id_idx" ON "question_blocks_multiple_choice" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_multiple_choice_path_idx" ON "question_blocks_multiple_choice" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "question_blocks_mcq_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"is_correct" boolean
  );
  
  CREATE TABLE "question_blocks_mcq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"shuffle" boolean,
  	"block_name" varchar
  );
  
  DROP TABLE "question_blocks_multiple_choice_answers" CASCADE;
  DROP TABLE "question_blocks_multiple_choice" CASCADE;
  DROP TABLE "question_blocks_self_report" CASCADE;
  DROP TABLE "question_blocks_free_text_validation" CASCADE;
  ALTER TABLE "question_blocks_mcq_options" ADD CONSTRAINT "question_blocks_mcq_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_blocks_mcq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_blocks_mcq" ADD CONSTRAINT "question_blocks_mcq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_blocks_mcq_options_order_idx" ON "question_blocks_mcq_options" USING btree ("_order");
  CREATE INDEX "question_blocks_mcq_options_parent_id_idx" ON "question_blocks_mcq_options" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_mcq_order_idx" ON "question_blocks_mcq" USING btree ("_order");
  CREATE INDEX "question_blocks_mcq_parent_id_idx" ON "question_blocks_mcq" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_mcq_path_idx" ON "question_blocks_mcq" USING btree ("_path");`)
}
