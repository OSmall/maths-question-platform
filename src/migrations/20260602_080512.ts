import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_syllabus_sub_topic_status" ADD VALUE 'optional';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "syllabus_sub_topic" SET "status" = 'included' WHERE "status" = 'optional';
   ALTER TABLE "syllabus_sub_topic" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "syllabus_sub_topic" ALTER COLUMN "status" SET DEFAULT 'included'::text;
  DROP TYPE "public"."enum_syllabus_sub_topic_status";
  CREATE TYPE "public"."enum_syllabus_sub_topic_status" AS ENUM('included', 'assumedKnowledge');
  ALTER TABLE "syllabus_sub_topic" ALTER COLUMN "status" SET DEFAULT 'included'::"public"."enum_syllabus_sub_topic_status";
  ALTER TABLE "syllabus_sub_topic" ALTER COLUMN "status" SET DATA TYPE "public"."enum_syllabus_sub_topic_status" USING "status"::"public"."enum_syllabus_sub_topic_status";`)
}
