import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "question_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"aspect_id" integer
  );
  
  CREATE TABLE "aspect" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "question" ALTER COLUMN "question_rich_text" SET NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "aspect_id" integer;
  ALTER TABLE "question_rels" ADD CONSTRAINT "question_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_rels" ADD CONSTRAINT "question_rels_aspect_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_rels_order_idx" ON "question_rels" USING btree ("order");
  CREATE INDEX "question_rels_parent_idx" ON "question_rels" USING btree ("parent_id");
  CREATE INDEX "question_rels_path_idx" ON "question_rels" USING btree ("path");
  CREATE INDEX "question_rels_aspect_id_idx" ON "question_rels" USING btree ("aspect_id");
  CREATE UNIQUE INDEX "aspect_name_idx" ON "aspect" USING btree ("name");
  CREATE INDEX "aspect_updated_at_idx" ON "aspect" USING btree ("updated_at");
  CREATE INDEX "aspect_created_at_idx" ON "aspect" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_aspect_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_aspect_id_idx" ON "payload_locked_documents_rels" USING btree ("aspect_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "question_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "aspect" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "question_rels" CASCADE;
  DROP TABLE "aspect" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_aspect_fk";
  
  DROP INDEX "payload_locked_documents_rels_aspect_id_idx";
  ALTER TABLE "question" ALTER COLUMN "question_rich_text" DROP NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "aspect_id";`)
}
