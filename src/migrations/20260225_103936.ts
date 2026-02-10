import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_question_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__question_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_question_v_blocks_multiple_choice_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"answer" varchar,
  	"is_correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_question_v_blocks_multiple_choice" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"shuffle" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_question_v_blocks_self_report" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_question_v_blocks_free_text_validation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"correct_answer" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_question_v_version_parts_solution_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"solution_rich_text" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_question_v_version_parts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"part_rich_text" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_question_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_overall_question_rich_text" jsonb,
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
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"aspect_id" integer
  );
  
  ALTER TABLE "question_blocks_multiple_choice_answers" ALTER COLUMN "answer" DROP NOT NULL;
  ALTER TABLE "question_blocks_multiple_choice_answers" ALTER COLUMN "is_correct" SET DEFAULT false;
  ALTER TABLE "question_blocks_multiple_choice" ALTER COLUMN "shuffle" SET DEFAULT true;
  ALTER TABLE "question_parts_solution_methods" ALTER COLUMN "solution_rich_text" DROP NOT NULL;
  ALTER TABLE "question" ALTER COLUMN "overall_question_rich_text" DROP NOT NULL;
  ALTER TABLE "question" ADD COLUMN "_status" "enum_question_status" DEFAULT 'draft';
  ALTER TABLE "_question_v_blocks_multiple_choice_answers" ADD CONSTRAINT "_question_v_blocks_multiple_choice_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_blocks_multiple_choice"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_multiple_choice" ADD CONSTRAINT "_question_v_blocks_multiple_choice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_self_report" ADD CONSTRAINT "_question_v_blocks_self_report_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_free_text_validation" ADD CONSTRAINT "_question_v_blocks_free_text_validation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_version_parts_solution_methods" ADD CONSTRAINT "_question_v_version_parts_solution_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_version_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_version_parts" ADD CONSTRAINT "_question_v_version_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v" ADD CONSTRAINT "_question_v_parent_id_question_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_question_v_rels" ADD CONSTRAINT "_question_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_rels" ADD CONSTRAINT "_question_v_rels_aspect_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_question_v_blocks_multiple_choice_answers_order_idx" ON "_question_v_blocks_multiple_choice_answers" USING btree ("_order");
  CREATE INDEX "_question_v_blocks_multiple_choice_answers_parent_id_idx" ON "_question_v_blocks_multiple_choice_answers" USING btree ("_parent_id");
  CREATE INDEX "_question_v_blocks_multiple_choice_order_idx" ON "_question_v_blocks_multiple_choice" USING btree ("_order");
  CREATE INDEX "_question_v_blocks_multiple_choice_parent_id_idx" ON "_question_v_blocks_multiple_choice" USING btree ("_parent_id");
  CREATE INDEX "_question_v_blocks_multiple_choice_path_idx" ON "_question_v_blocks_multiple_choice" USING btree ("_path");
  CREATE INDEX "_question_v_blocks_self_report_order_idx" ON "_question_v_blocks_self_report" USING btree ("_order");
  CREATE INDEX "_question_v_blocks_self_report_parent_id_idx" ON "_question_v_blocks_self_report" USING btree ("_parent_id");
  CREATE INDEX "_question_v_blocks_self_report_path_idx" ON "_question_v_blocks_self_report" USING btree ("_path");
  CREATE INDEX "_question_v_blocks_free_text_validation_order_idx" ON "_question_v_blocks_free_text_validation" USING btree ("_order");
  CREATE INDEX "_question_v_blocks_free_text_validation_parent_id_idx" ON "_question_v_blocks_free_text_validation" USING btree ("_parent_id");
  CREATE INDEX "_question_v_blocks_free_text_validation_path_idx" ON "_question_v_blocks_free_text_validation" USING btree ("_path");
  CREATE INDEX "_question_v_version_parts_solution_methods_order_idx" ON "_question_v_version_parts_solution_methods" USING btree ("_order");
  CREATE INDEX "_question_v_version_parts_solution_methods_parent_id_idx" ON "_question_v_version_parts_solution_methods" USING btree ("_parent_id");
  CREATE INDEX "_question_v_version_parts_order_idx" ON "_question_v_version_parts" USING btree ("_order");
  CREATE INDEX "_question_v_version_parts_parent_id_idx" ON "_question_v_version_parts" USING btree ("_parent_id");
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
  CREATE INDEX "_question_v_rels_aspect_id_idx" ON "_question_v_rels" USING btree ("aspect_id");
  CREATE INDEX "question__status_idx" ON "question" USING btree ("_status");
  
  CREATE TEMP TABLE "_question_backfill_version_map" (
  	"parent_id" integer PRIMARY KEY NOT NULL,
  	"version_id" integer NOT NULL
  ) ON COMMIT DROP;
  
  CREATE TEMP TABLE "_question_backfill_part_map" (
  	"part_uuid" varchar PRIMARY KEY NOT NULL,
  	"version_part_id" integer NOT NULL
  ) ON COMMIT DROP;
  
  CREATE TEMP TABLE "_question_backfill_multiple_choice_map" (
  	"block_uuid" varchar PRIMARY KEY NOT NULL,
  	"version_block_id" integer NOT NULL
  ) ON COMMIT DROP;
  
  UPDATE "question" q
  SET "_status" = 'published'
  WHERE (q."_status" IS NULL OR q."_status" = 'draft')
   AND NOT EXISTS (
    SELECT 1
    FROM "_question_v" qv
    WHERE qv."parent_id" = q."id"
  );
  
  WITH inserted_versions AS (
  	INSERT INTO "_question_v" (
  		"parent_id",
  		"version_overall_question_rich_text",
  		"version_updated_at",
  		"version_created_at",
  		"version__status",
  		"created_at",
  		"updated_at",
  		"latest",
  		"autosave"
  	)
  	SELECT
  		q."id",
  		q."overall_question_rich_text",
  		q."updated_at",
  		q."created_at",
  		CASE
  			WHEN q."_status" = 'published'::"enum_question_status"
  				THEN 'published'::"enum__question_v_version_status"
  			ELSE 'draft'::"enum__question_v_version_status"
  		END,
  		q."created_at",
  		q."updated_at",
  		true,
  		false
  	FROM "question" q
  	WHERE NOT EXISTS (
  		SELECT 1
  		FROM "_question_v" qv
  		WHERE qv."parent_id" = q."id"
  	)
  	RETURNING "id", "parent_id"
  )
  INSERT INTO "_question_backfill_version_map" ("parent_id", "version_id")
  SELECT iv."parent_id", iv."id"
  FROM inserted_versions iv;
  
  WITH inserted_parts AS (
  	INSERT INTO "_question_v_version_parts" (
  		"_order",
  		"_parent_id",
  		"part_rich_text",
  		"_uuid"
  	)
  	SELECT
  		qp."_order",
  		qvm."version_id",
  		qp."part_rich_text",
  		qp."id"
  	FROM "question_parts" qp
  	INNER JOIN "_question_backfill_version_map" qvm
  		ON qp."_parent_id" = qvm."parent_id"
  	RETURNING "id", "_uuid"
  )
  INSERT INTO "_question_backfill_part_map" ("part_uuid", "version_part_id")
  SELECT ip."_uuid", ip."id"
  FROM inserted_parts ip;
  
  INSERT INTO "_question_v_version_parts_solution_methods" (
  	"_order",
  	"_parent_id",
  	"solution_rich_text",
  	"_uuid"
  )
  SELECT
  	qpsm."_order",
  	qpm."version_part_id",
  	qpsm."solution_rich_text",
  	qpsm."id"
  FROM "question_parts_solution_methods" qpsm
  INNER JOIN "_question_backfill_part_map" qpm
  	ON qpsm."_parent_id" = qpm."part_uuid";
  
  WITH inserted_multiple_choice_blocks AS (
  	INSERT INTO "_question_v_blocks_multiple_choice" (
  		"_order",
  		"_parent_id",
  		"_path",
  		"shuffle",
  		"_uuid",
  		"block_name"
  	)
  SELECT
  	qbmc."_order",
  	qvm."version_id",
  	CASE
  		WHEN qbmc."_path" LIKE 'version.%' THEN qbmc."_path"
  		ELSE 'version.' || qbmc."_path"
  	END,
  	qbmc."shuffle",
  	qbmc."id",
  	qbmc."block_name"
  	FROM "question_blocks_multiple_choice" qbmc
  	INNER JOIN "_question_backfill_version_map" qvm
  		ON qbmc."_parent_id" = qvm."parent_id"
  	RETURNING "id", "_uuid"
  )
  INSERT INTO "_question_backfill_multiple_choice_map" ("block_uuid", "version_block_id")
  SELECT imc."_uuid", imc."id"
  FROM inserted_multiple_choice_blocks imc;
  
  INSERT INTO "_question_v_blocks_multiple_choice_answers" (
  	"_order",
  	"_parent_id",
  	"answer",
  	"is_correct",
  	"_uuid"
  )
  SELECT
  	qbmca."_order",
  	qmcm."version_block_id",
  	qbmca."answer",
  	qbmca."is_correct",
  	qbmca."id"
  FROM "question_blocks_multiple_choice_answers" qbmca
  INNER JOIN "_question_backfill_multiple_choice_map" qmcm
  	ON qbmca."_parent_id" = qmcm."block_uuid";
  
  INSERT INTO "_question_v_blocks_self_report" (
  	"_order",
  	"_parent_id",
  	"_path",
  	"_uuid",
  	"block_name"
  )
  SELECT
  	qbsr."_order",
  	qvm."version_id",
  	CASE
  		WHEN qbsr."_path" LIKE 'version.%' THEN qbsr."_path"
  		ELSE 'version.' || qbsr."_path"
  	END,
  	qbsr."id",
  	qbsr."block_name"
  FROM "question_blocks_self_report" qbsr
  INNER JOIN "_question_backfill_version_map" qvm
  	ON qbsr."_parent_id" = qvm."parent_id";
  
  INSERT INTO "_question_v_blocks_free_text_validation" (
  	"_order",
  	"_parent_id",
  	"_path",
  	"correct_answer",
  	"_uuid",
  	"block_name"
  )
  SELECT
  	qbftv."_order",
  	qvm."version_id",
  	CASE
  		WHEN qbftv."_path" LIKE 'version.%' THEN qbftv."_path"
  		ELSE 'version.' || qbftv."_path"
  	END,
  	qbftv."correct_answer",
  	qbftv."id",
  	qbftv."block_name"
  FROM "question_blocks_free_text_validation" qbftv
  INNER JOIN "_question_backfill_version_map" qvm
  	ON qbftv."_parent_id" = qvm."parent_id";
  
  INSERT INTO "_question_v_rels" (
  	"order",
  	"parent_id",
  	"path",
  	"aspect_id"
  )
  SELECT
  	qr."order",
  	qvm."version_id",
  	CASE
  		WHEN qr."path" LIKE 'version.%' THEN qr."path"
  		ELSE 'version.' || qr."path"
  	END,
  	qr."aspect_id"
  FROM "question_rels" qr
  INNER JOIN "_question_backfill_version_map" qvm
  	ON qr."parent_id" = qvm."parent_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_question_v_blocks_multiple_choice_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_multiple_choice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_self_report" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_free_text_validation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_version_parts_solution_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_version_parts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_question_v_blocks_multiple_choice_answers" CASCADE;
  DROP TABLE "_question_v_blocks_multiple_choice" CASCADE;
  DROP TABLE "_question_v_blocks_self_report" CASCADE;
  DROP TABLE "_question_v_blocks_free_text_validation" CASCADE;
  DROP TABLE "_question_v_version_parts_solution_methods" CASCADE;
  DROP TABLE "_question_v_version_parts" CASCADE;
  DROP TABLE "_question_v" CASCADE;
  DROP TABLE "_question_v_rels" CASCADE;
  DROP INDEX "question__status_idx";
  ALTER TABLE "question_blocks_multiple_choice_answers" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "question_blocks_multiple_choice_answers" ALTER COLUMN "is_correct" DROP DEFAULT;
  ALTER TABLE "question_blocks_multiple_choice" ALTER COLUMN "shuffle" DROP DEFAULT;
  ALTER TABLE "question_parts_solution_methods" ALTER COLUMN "solution_rich_text" SET NOT NULL;
  ALTER TABLE "question" ALTER COLUMN "overall_question_rich_text" SET NOT NULL;
  ALTER TABLE "question" DROP COLUMN "_status";
  DROP TYPE "public"."enum_question_status";
  DROP TYPE "public"."enum__question_v_version_status";`)
}
