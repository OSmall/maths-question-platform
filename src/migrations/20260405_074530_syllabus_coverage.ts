import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_syllabus_sub_topic_status" AS ENUM('included', 'assumedKnowledge');
  CREATE TABLE "syllabus" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "syllabus_sub_topic" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"syllabus_id" integer NOT NULL,
  	"sub_topic_id" integer NOT NULL,
  	"status" "enum_syllabus_sub_topic_status" DEFAULT 'included' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "syllabus_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "syllabus_sub_topic_id" integer;
  ALTER TABLE "syllabus_sub_topic" ADD CONSTRAINT "syllabus_sub_topic_syllabus_id_syllabus_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "syllabus_sub_topic" ADD CONSTRAINT "syllabus_sub_topic_sub_topic_id_sub_topic_id_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "syllabus_name_idx" ON "syllabus" USING btree ("name");
  CREATE INDEX "syllabus_updated_at_idx" ON "syllabus" USING btree ("updated_at");
  CREATE INDEX "syllabus_created_at_idx" ON "syllabus" USING btree ("created_at");
  CREATE INDEX "syllabus_sub_topic_syllabus_idx" ON "syllabus_sub_topic" USING btree ("syllabus_id");
  CREATE INDEX "syllabus_sub_topic_sub_topic_idx" ON "syllabus_sub_topic" USING btree ("sub_topic_id");
  CREATE INDEX "syllabus_sub_topic_updated_at_idx" ON "syllabus_sub_topic" USING btree ("updated_at");
  CREATE INDEX "syllabus_sub_topic_created_at_idx" ON "syllabus_sub_topic" USING btree ("created_at");
  CREATE UNIQUE INDEX "syllabus_subTopic_idx" ON "syllabus_sub_topic" USING btree ("syllabus_id","sub_topic_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_syllabus_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_syllabus_sub_topic_fk" FOREIGN KEY ("syllabus_sub_topic_id") REFERENCES "public"."syllabus_sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_syllabus_id_idx" ON "payload_locked_documents_rels" USING btree ("syllabus_id");
  CREATE INDEX "payload_locked_documents_rels_syllabus_sub_topic_id_idx" ON "payload_locked_documents_rels" USING btree ("syllabus_sub_topic_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "syllabus" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "syllabus_sub_topic" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "syllabus" CASCADE;
  DROP TABLE "syllabus_sub_topic" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_syllabus_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_syllabus_sub_topic_fk";
  
  DROP INDEX "payload_locked_documents_rels_syllabus_id_idx";
  DROP INDEX "payload_locked_documents_rels_syllabus_sub_topic_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "syllabus_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "syllabus_sub_topic_id";
  DROP TYPE "public"."enum_syllabus_sub_topic_status";`)
}
