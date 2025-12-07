import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "question_parts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"part_rich_text" jsonb
  );
  
  ALTER TABLE "question" RENAME COLUMN "question_rich_text" TO "overall_question_rich_text";
  ALTER TABLE "question_parts" ADD CONSTRAINT "question_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_parts_order_idx" ON "question_parts" USING btree ("_order");
  CREATE INDEX "question_parts_parent_id_idx" ON "question_parts" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "question_parts" CASCADE;
  ALTER TABLE "question" RENAME COLUMN "overall_question_rich_text" TO "question_rich_text";`)
}
