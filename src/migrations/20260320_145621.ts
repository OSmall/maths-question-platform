import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_question_parts_response_type" AS ENUM('multipleChoice', 'shortText', 'selfReport');
  CREATE TYPE "public"."enum__question_v_version_parts_response_type" AS ENUM('multipleChoice', 'shortText', 'selfReport');
  CREATE TABLE "topic" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sub_topic" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"topic_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "question_parts_response_multiple_choice_choices" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false
  );
  
  CREATE TABLE "question_parts_response_short_text_accepted_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "question_parts_worked_solutions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prompt" jsonb
  );
  
  CREATE TABLE "_question_v_version_parts_response_multiple_choice_choices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"is_correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_question_v_version_parts_response_short_text_accepted_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_question_v_version_parts_worked_solutions" (
   	"_order" integer NOT NULL,
   	"_parent_id" integer NOT NULL,
   	"id" serial PRIMARY KEY NOT NULL,
   	"prompt" jsonb,
   	"_uuid" varchar
  );

  ALTER TABLE "question_parts" ADD COLUMN "prompt" jsonb;
  ALTER TABLE "question_parts" ADD COLUMN "response_type" "enum_question_parts_response_type";
  ALTER TABLE "question_parts" ADD COLUMN "response_multiple_choice_shuffle" boolean DEFAULT true;
  ALTER TABLE "question" ADD COLUMN "prompt" jsonb;
  ALTER TABLE "question_rels" ADD COLUMN "sub_topic_id" integer;
  ALTER TABLE "_question_v_version_parts" ADD COLUMN "prompt" jsonb;
  ALTER TABLE "_question_v_version_parts" ADD COLUMN "response_type" "enum__question_v_version_parts_response_type";
  ALTER TABLE "_question_v_version_parts" ADD COLUMN "response_multiple_choice_shuffle" boolean DEFAULT true;
  ALTER TABLE "_question_v" ADD COLUMN "version_prompt" jsonb;
  ALTER TABLE "_question_v_rels" ADD COLUMN "sub_topic_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "topic_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sub_topic_id" integer;

  ALTER TABLE "sub_topic" ADD CONSTRAINT "sub_topic_topic_id_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "question_parts_response_multiple_choice_choices" ADD CONSTRAINT "question_parts_response_multiple_choice_choices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_parts_response_short_text_accepted_answers" ADD CONSTRAINT "q_parts_st_answers_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_parts_worked_solutions" ADD CONSTRAINT "question_parts_worked_solutions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_version_parts_response_multiple_choice_choices" ADD CONSTRAINT "qv_vparts_mc_choices_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_version_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_version_parts_response_short_text_accepted_answers" ADD CONSTRAINT "qv_vparts_st_answers_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_version_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_version_parts_worked_solutions" ADD CONSTRAINT "_question_v_version_parts_worked_solutions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_version_parts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "topic_name_ci_unique_idx" ON "topic" USING btree (lower(regexp_replace(btrim("name"), '\\s+', ' ', 'g')));
  CREATE INDEX "topic_updated_at_idx" ON "topic" USING btree ("updated_at");
  CREATE INDEX "topic_created_at_idx" ON "topic" USING btree ("created_at");
  CREATE INDEX "sub_topic_topic_idx" ON "sub_topic" USING btree ("topic_id");
  CREATE UNIQUE INDEX "sub_topic_topic_name_ci_idx" ON "sub_topic" USING btree ("topic_id", lower(regexp_replace(btrim("name"), '\\s+', ' ', 'g')));
  CREATE INDEX "sub_topic_updated_at_idx" ON "sub_topic" USING btree ("updated_at");
  CREATE INDEX "sub_topic_created_at_idx" ON "sub_topic" USING btree ("created_at");
  CREATE INDEX "question_parts_response_multiple_choice_choices_order_idx" ON "question_parts_response_multiple_choice_choices" USING btree ("_order");
  CREATE INDEX "question_parts_response_multiple_choice_choices_parent_id_idx" ON "question_parts_response_multiple_choice_choices" USING btree ("_parent_id");
  CREATE INDEX "q_parts_st_answers_order_idx" ON "question_parts_response_short_text_accepted_answers" USING btree ("_order");
  CREATE INDEX "q_parts_st_answers_parent_idx" ON "question_parts_response_short_text_accepted_answers" USING btree ("_parent_id");
  CREATE INDEX "question_parts_worked_solutions_order_idx" ON "question_parts_worked_solutions" USING btree ("_order");
  CREATE INDEX "question_parts_worked_solutions_parent_id_idx" ON "question_parts_worked_solutions" USING btree ("_parent_id");
  CREATE INDEX "qv_vparts_mc_choices_order_idx" ON "_question_v_version_parts_response_multiple_choice_choices" USING btree ("_order");
  CREATE INDEX "qv_vparts_mc_choices_parent_idx" ON "_question_v_version_parts_response_multiple_choice_choices" USING btree ("_parent_id");
  CREATE INDEX "qv_vparts_st_answers_order_idx" ON "_question_v_version_parts_response_short_text_accepted_answers" USING btree ("_order");
  CREATE INDEX "qv_vparts_st_answers_parent_idx" ON "_question_v_version_parts_response_short_text_accepted_answers" USING btree ("_parent_id");
  CREATE INDEX "_question_v_version_parts_worked_solutions_order_idx" ON "_question_v_version_parts_worked_solutions" USING btree ("_order");
  CREATE INDEX "_question_v_version_parts_worked_solutions_parent_id_idx" ON "_question_v_version_parts_worked_solutions" USING btree ("_parent_id");

  CREATE TEMP TABLE "_aspect_split_map" (
	"aspect_id" integer PRIMARY KEY NOT NULL,
	"aspect_name" varchar NOT NULL,
	"underscore_position" integer NOT NULL,
	"topic_name" varchar NOT NULL,
	"sub_topic_name" varchar NOT NULL,
	"topic_normalized" varchar NOT NULL,
	"sub_topic_normalized" varchar NOT NULL,
	"created_at" timestamp(3) with time zone NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO "_aspect_split_map" (
	"aspect_id",
	"aspect_name",
	"underscore_position",
	"topic_name",
	"sub_topic_name",
	"topic_normalized",
	"sub_topic_normalized",
	"created_at",
	"updated_at"
  )
  SELECT
	a."id",
	a."name",
	position('_' in a."name"),
	trim(split_part(a."name", '_', 1)),
	trim(substring(a."name" from position('_' in a."name") + 1)),
	lower(trim(split_part(a."name", '_', 1))),
	lower(trim(substring(a."name" from position('_' in a."name") + 1))),
	a."created_at",
	a."updated_at"
  FROM "aspect" a;

  DO $$
  BEGIN
	IF EXISTS (
		SELECT 1
		FROM "_aspect_split_map"
		WHERE "underscore_position" = 0
		   OR "topic_name" = ''
		   OR "sub_topic_name" = ''
	) THEN
		RAISE EXCEPTION 'Aspect names must follow Topic_SubTopic and split cleanly on the first underscore before migrating.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "_aspect_split_map"
		GROUP BY "topic_normalized", "sub_topic_normalized"
		HAVING COUNT(DISTINCT "topic_name" || ' / ' || "sub_topic_name") > 1
	) THEN
		RAISE EXCEPTION 'Aspect name migration found case-collision conflicts when deriving topic/subTopic pairs.';
	END IF;
	END $$;

  INSERT INTO "topic" ("name", "created_at", "updated_at")
  SELECT
	MIN("topic_name") AS "name",
	MIN("created_at") AS "created_at",
	MAX("updated_at") AS "updated_at"
  FROM "_aspect_split_map"
  GROUP BY "topic_normalized";

  INSERT INTO "sub_topic" (
	"name",
	"topic_id",
	"created_at",
	"updated_at"
  )
  SELECT
	MIN(asm."sub_topic_name") AS "name",
	t."id" AS "topic_id",
	MIN(asm."created_at") AS "created_at",
	MAX(asm."updated_at") AS "updated_at"
  FROM "_aspect_split_map" asm
  INNER JOIN "topic" t
	ON lower(regexp_replace(btrim(t."name"), '\\s+', ' ', 'g')) = asm."topic_normalized"
  GROUP BY t."id", asm."sub_topic_normalized";

  CREATE TEMP TABLE "_aspect_to_sub_topic_map" (
	"aspect_id" integer PRIMARY KEY NOT NULL,
	"sub_topic_id" integer NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO "_aspect_to_sub_topic_map" ("aspect_id", "sub_topic_id")
  SELECT
	asm."aspect_id",
	st."id"
  FROM "_aspect_split_map" asm
  INNER JOIN "topic" t
	ON lower(regexp_replace(btrim(t."name"), '\\s+', ' ', 'g')) = asm."topic_normalized"
  INNER JOIN "sub_topic" st
	ON st."topic_id" = t."id"
	AND lower(regexp_replace(btrim(st."name"), '\\s+', ' ', 'g')) = asm."sub_topic_normalized";

  CREATE TEMP TABLE "_question_part_response_count" (
	"part_id" varchar PRIMARY KEY NOT NULL,
	"response_count" integer NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO "_question_part_response_count" ("part_id", "response_count")
  SELECT
	qp."id",
	COUNT(response_rows."question_id")::integer AS "response_count"
  FROM "question_parts" qp
  LEFT JOIN (
	SELECT qbmc."_parent_id" AS "question_id", substring(qbmc."_path" from 'parts\\.([0-9]+)\\.')::integer + 1 AS "part_order"
	FROM "question_blocks_multiple_choice" qbmc
	UNION ALL
	SELECT qbsr."_parent_id" AS "question_id", substring(qbsr."_path" from 'parts\\.([0-9]+)\\.')::integer + 1 AS "part_order"
	FROM "question_blocks_self_report" qbsr
	UNION ALL
	SELECT qbftv."_parent_id" AS "question_id", substring(qbftv."_path" from 'parts\\.([0-9]+)\\.')::integer + 1 AS "part_order"
	FROM "question_blocks_free_text_validation" qbftv
  ) response_rows
	ON response_rows."question_id" = qp."_parent_id"
	AND response_rows."part_order" = qp."_order"
  GROUP BY qp."id";

  DO $$
  BEGIN
	IF EXISTS (
		SELECT 1
		FROM "_question_part_response_count"
		WHERE "response_count" <> 1
	) THEN
		RAISE EXCEPTION 'Every current question part must map to exactly one response block before migrating to response groups.';
	END IF;
	END $$;

  UPDATE "question" q
  SET "prompt" = q."overall_question_rich_text";

  WITH single_part_questions AS (
	SELECT q."id", qp."part_rich_text"
	FROM "question" q
	INNER JOIN "question_parts" qp
		ON qp."_parent_id" = q."id"
		AND qp."_order" = 1
	WHERE NOT EXISTS (
		SELECT 1
		FROM "question_parts" qp2
		WHERE qp2."_parent_id" = q."id"
		  AND qp2."id" <> qp."id"
	)
  )
  UPDATE "question" q
  SET "prompt" = spq."part_rich_text"
  FROM single_part_questions spq
  WHERE q."id" = spq."id"
	AND q."prompt" IS NULL;

  UPDATE "question_parts"
  SET "prompt" = "part_rich_text";

  UPDATE "_question_v" qv
  SET "version_prompt" = qv."version_overall_question_rich_text";

  WITH single_part_versions AS (
	SELECT qv."id", qvp."part_rich_text"
	FROM "_question_v" qv
	INNER JOIN "_question_v_version_parts" qvp
		ON qvp."_parent_id" = qv."id"
		AND qvp."_order" = 1
	WHERE NOT EXISTS (
		SELECT 1
		FROM "_question_v_version_parts" qvp2
		WHERE qvp2."_parent_id" = qv."id"
		  AND qvp2."id" <> qvp."id"
	)
  )
  UPDATE "_question_v" qv
  SET "version_prompt" = spv."part_rich_text"
  FROM single_part_versions spv
  WHERE qv."id" = spv."id"
	AND qv."version_prompt" IS NULL;

  UPDATE "_question_v_version_parts"
  SET "prompt" = "part_rich_text";

  UPDATE "question_parts" qp
  SET
	"response_type" = 'multipleChoice'::"enum_question_parts_response_type",
	"response_multiple_choice_shuffle" = COALESCE(qbmc."shuffle", true)
  FROM "question_blocks_multiple_choice" qbmc
  WHERE qp."_parent_id" = qbmc."_parent_id"
	AND qp."_order" = substring(qbmc."_path" from 'parts\\.([0-9]+)\\.')::integer + 1;

  UPDATE "question_parts" qp
  SET "response_type" = 'selfReport'::"enum_question_parts_response_type"
  FROM "question_blocks_self_report" qbsr
  WHERE qp."_parent_id" = qbsr."_parent_id"
	AND qp."_order" = substring(qbsr."_path" from 'parts\\.([0-9]+)\\.')::integer + 1;

  UPDATE "question_parts" qp
  SET "response_type" = 'shortText'::"enum_question_parts_response_type"
  FROM "question_blocks_free_text_validation" qbftv
  WHERE qp."_parent_id" = qbftv."_parent_id"
	AND qp."_order" = substring(qbftv."_path" from 'parts\\.([0-9]+)\\.')::integer + 1;

  INSERT INTO "question_parts_worked_solutions" (
	"_order",
	"_parent_id",
	"id",
	"prompt"
  )
  SELECT
	qpsm."_order",
	qpsm."_parent_id",
	qpsm."id",
	qpsm."solution_rich_text"
  FROM "question_parts_solution_methods" qpsm;

  INSERT INTO "question_parts_response_multiple_choice_choices" (
	"_order",
	"_parent_id",
	"id",
	"text",
	"is_correct"
  )
  SELECT
	qbmca."_order",
	qp."id",
	qbmca."id",
	qbmca."answer",
	COALESCE(qbmca."is_correct", false)
  FROM "question_blocks_multiple_choice_answers" qbmca
  INNER JOIN "question_blocks_multiple_choice" qbmc
	ON qbmc."id" = qbmca."_parent_id"
  INNER JOIN "question_parts" qp
	ON qp."_parent_id" = qbmc."_parent_id"
	AND qp."_order" = substring(qbmc."_path" from 'parts\\.([0-9]+)\\.')::integer + 1;

  INSERT INTO "question_parts_response_short_text_accepted_answers" (
	"_order",
	"_parent_id",
	"id",
	"value"
  )
  SELECT
	0,
	qp."id",
	qbftv."id",
	qbftv."correct_answer"
  FROM "question_blocks_free_text_validation" qbftv
  INNER JOIN "question_parts" qp
	ON qp."_parent_id" = qbftv."_parent_id"
	AND qp."_order" = substring(qbftv."_path" from 'parts\\.([0-9]+)\\.')::integer + 1
  WHERE qbftv."correct_answer" IS NOT NULL;

  UPDATE "_question_v_version_parts" qvp
  SET
	"response_type" = 'multipleChoice'::"enum__question_v_version_parts_response_type",
	"response_multiple_choice_shuffle" = COALESCE(qbmc."shuffle", true)
  FROM "_question_v_blocks_multiple_choice" qbmc
  WHERE qvp."_parent_id" = qbmc."_parent_id"
	AND qvp."_order" = substring(qbmc."_path" from '(?:version\\.)?parts\\.([0-9]+)\\.')::integer + 1;

  UPDATE "_question_v_version_parts" qvp
  SET "response_type" = 'selfReport'::"enum__question_v_version_parts_response_type"
  FROM "_question_v_blocks_self_report" qbsr
  WHERE qvp."_parent_id" = qbsr."_parent_id"
	AND qvp."_order" = substring(qbsr."_path" from '(?:version\\.)?parts\\.([0-9]+)\\.')::integer + 1;

  UPDATE "_question_v_version_parts" qvp
  SET "response_type" = 'shortText'::"enum__question_v_version_parts_response_type"
  FROM "_question_v_blocks_free_text_validation" qbftv
  WHERE qvp."_parent_id" = qbftv."_parent_id"
	AND qvp."_order" = substring(qbftv."_path" from '(?:version\\.)?parts\\.([0-9]+)\\.')::integer + 1;

  INSERT INTO "_question_v_version_parts_worked_solutions" (
	"_order",
	"_parent_id",
	"prompt",
	"_uuid"
  )
  SELECT
	qpsm."_order",
	qpsm."_parent_id",
	qpsm."solution_rich_text",
	qpsm."id"
  FROM "_question_v_version_parts_solution_methods" qpsm;

  INSERT INTO "_question_v_version_parts_response_multiple_choice_choices" (
	"_order",
	"_parent_id",
	"text",
	"is_correct",
	"_uuid"
  )
  SELECT
	qbmca."_order",
	qvp."id",
	qbmca."answer",
	COALESCE(qbmca."is_correct", false),
	qbmca."_uuid"
  FROM "_question_v_blocks_multiple_choice_answers" qbmca
  INNER JOIN "_question_v_blocks_multiple_choice" qbmc
	ON qbmc."id" = qbmca."_parent_id"
  INNER JOIN "_question_v_version_parts" qvp
	ON qvp."_parent_id" = qbmc."_parent_id"
	AND qvp."_order" = substring(qbmc."_path" from '(?:version\\.)?parts\\.([0-9]+)\\.')::integer + 1;

  INSERT INTO "_question_v_version_parts_response_short_text_accepted_answers" (
	"_order",
	"_parent_id",
	"value",
	"_uuid"
  )
  SELECT
	0,
	qvp."id",
	qbftv."correct_answer",
	qbftv."_uuid"
  FROM "_question_v_blocks_free_text_validation" qbftv
  INNER JOIN "_question_v_version_parts" qvp
	ON qvp."_parent_id" = qbftv."_parent_id"
	AND qvp."_order" = substring(qbftv."_path" from '(?:version\\.)?parts\\.([0-9]+)\\.')::integer + 1
  WHERE qbftv."correct_answer" IS NOT NULL;

  UPDATE "question_rels" qr
  SET
	"sub_topic_id" = astm."sub_topic_id",
	"path" = CASE
		WHEN qr."path" = 'questionAspects' THEN 'subTopics'
		ELSE replace(replace(qr."path", 'solutionMethods', 'workedSolutions'), 'solutionAspects', 'subTopics')
	END
  FROM "_aspect_to_sub_topic_map" astm
  WHERE qr."aspect_id" = astm."aspect_id";

  UPDATE "_question_v_rels" qvr
  SET
	"sub_topic_id" = astm."sub_topic_id",
	"path" = CASE
		WHEN qvr."path" = 'version.questionAspects' THEN 'version.subTopics'
		ELSE replace(replace(qvr."path", 'solutionMethods', 'workedSolutions'), 'solutionAspects', 'subTopics')
	END
  FROM "_aspect_to_sub_topic_map" astm
  WHERE qvr."aspect_id" = astm."aspect_id";

  UPDATE "payload_locked_documents_rels" pldr
  SET "sub_topic_id" = astm."sub_topic_id"
  FROM "_aspect_to_sub_topic_map" astm
  WHERE pldr."aspect_id" = astm."aspect_id";

  DO $$
  BEGIN
	IF EXISTS (
		SELECT 1
		FROM "question" q
		INNER JOIN "question_parts" qp
			ON qp."_parent_id" = q."id"
		LEFT JOIN (
			SELECT "_parent_id", COUNT(*) AS choice_count, SUM(CASE WHEN COALESCE("is_correct", false) THEN 1 ELSE 0 END) AS correct_count,
			       BOOL_OR("text" IS NULL OR btrim("text") = '') AS has_blank_choice
			FROM "question_parts_response_multiple_choice_choices"
			GROUP BY "_parent_id"
		) mcq
			ON mcq."_parent_id" = qp."id"
		LEFT JOIN (
			SELECT "_parent_id", COUNT(*) AS answer_count, BOOL_OR("value" IS NULL OR btrim("value") = '') AS has_blank_answer
			FROM "question_parts_response_short_text_accepted_answers"
			GROUP BY "_parent_id"
		) short_text
			ON short_text."_parent_id" = qp."id"
		WHERE q."_status" = 'published'
		  AND (
			qp."response_type" IS NULL
			OR (qp."response_type" = 'multipleChoice' AND (COALESCE(mcq."choice_count", 0) < 2 OR COALESCE(mcq."correct_count", 0) <> 1 OR COALESCE(mcq."has_blank_choice", false)))
			OR (qp."response_type" = 'shortText' AND (COALESCE(short_text."answer_count", 0) < 1 OR COALESCE(short_text."has_blank_answer", false)))
		  )
	) THEN
		RAISE EXCEPTION 'Published questions must remain structurally valid after response migration.';
	END IF;
	END $$;

  ALTER TABLE "question_rels" DROP CONSTRAINT "question_rels_aspect_fk";
  ALTER TABLE "_question_v_rels" DROP CONSTRAINT "_question_v_rels_aspect_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_aspect_fk";

  DROP INDEX "question_rels_aspect_id_idx";
  DROP INDEX "_question_v_rels_aspect_id_idx";
  DROP INDEX "payload_locked_documents_rels_aspect_id_idx";

  ALTER TABLE "question_rels" ADD CONSTRAINT "question_rels_sub_topic_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_rels" ADD CONSTRAINT "_question_v_rels_sub_topic_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topic_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topic"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sub_topic_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topic"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "question_rels_sub_topic_id_idx" ON "question_rels" USING btree ("sub_topic_id");
  CREATE INDEX "_question_v_rels_sub_topic_id_idx" ON "_question_v_rels" USING btree ("sub_topic_id");
  CREATE INDEX "payload_locked_documents_rels_topic_id_idx" ON "payload_locked_documents_rels" USING btree ("topic_id");
  CREATE INDEX "payload_locked_documents_rels_sub_topic_id_idx" ON "payload_locked_documents_rels" USING btree ("sub_topic_id");

  ALTER TABLE "question_blocks_multiple_choice_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_blocks_multiple_choice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_blocks_self_report" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_blocks_free_text_validation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_parts_solution_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_multiple_choice_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_multiple_choice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_self_report" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_blocks_free_text_validation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_version_parts_solution_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "aspect" DISABLE ROW LEVEL SECURITY;

  DROP TABLE "question_blocks_multiple_choice_answers" CASCADE;
  DROP TABLE "question_blocks_multiple_choice" CASCADE;
  DROP TABLE "question_blocks_self_report" CASCADE;
  DROP TABLE "question_blocks_free_text_validation" CASCADE;
  DROP TABLE "question_parts_solution_methods" CASCADE;
  DROP TABLE "_question_v_blocks_multiple_choice_answers" CASCADE;
  DROP TABLE "_question_v_blocks_multiple_choice" CASCADE;
  DROP TABLE "_question_v_blocks_self_report" CASCADE;
  DROP TABLE "_question_v_blocks_free_text_validation" CASCADE;
  DROP TABLE "_question_v_version_parts_solution_methods" CASCADE;
  DROP TABLE "aspect" CASCADE;

  ALTER TABLE "question_parts" DROP COLUMN "part_rich_text";
  ALTER TABLE "question" DROP COLUMN "overall_question_rich_text";
  ALTER TABLE "question_rels" DROP COLUMN "aspect_id";
  ALTER TABLE "_question_v_version_parts" DROP COLUMN "part_rich_text";
  ALTER TABLE "_question_v" DROP COLUMN "version_overall_question_rich_text";
  ALTER TABLE "_question_v_rels" DROP COLUMN "aspect_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "aspect_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "question_blocks_multiple_choice_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"answer" varchar,
  	"is_correct" boolean DEFAULT false
  );
  
  CREATE TABLE "question_blocks_multiple_choice" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"shuffle" boolean DEFAULT true,
  	"block_name" varchar
  );
  
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
  
  CREATE TABLE "question_parts_solution_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"solution_rich_text" jsonb
  );
  
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
  
  CREATE TABLE "aspect" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "topic" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sub_topic" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_parts_response_multiple_choice_choices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_parts_response_short_text_accepted_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "question_parts_worked_solutions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_version_parts_response_multiple_choice_choices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_version_parts_response_short_text_accepted_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_question_v_version_parts_worked_solutions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "topic" CASCADE;
  DROP TABLE "sub_topic" CASCADE;
  DROP TABLE "question_parts_response_multiple_choice_choices" CASCADE;
  DROP TABLE "question_parts_response_short_text_accepted_answers" CASCADE;
  DROP TABLE "question_parts_worked_solutions" CASCADE;
  DROP TABLE "_question_v_version_parts_response_multiple_choice_choices" CASCADE;
  DROP TABLE "_question_v_version_parts_response_short_text_accepted_answers" CASCADE;
  DROP TABLE "_question_v_version_parts_worked_solutions" CASCADE;
  ALTER TABLE "question_rels" DROP CONSTRAINT "question_rels_sub_topic_fk";
  
  ALTER TABLE "_question_v_rels" DROP CONSTRAINT "_question_v_rels_sub_topic_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_topic_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sub_topic_fk";
  
  DROP INDEX "question_rels_sub_topic_id_idx";
  DROP INDEX "_question_v_rels_sub_topic_id_idx";
  DROP INDEX "payload_locked_documents_rels_topic_id_idx";
  DROP INDEX "payload_locked_documents_rels_sub_topic_id_idx";
  ALTER TABLE "question_parts" ADD COLUMN "part_rich_text" jsonb;
  ALTER TABLE "question" ADD COLUMN "overall_question_rich_text" jsonb;
  ALTER TABLE "question_rels" ADD COLUMN "aspect_id" integer;
  ALTER TABLE "_question_v_version_parts" ADD COLUMN "part_rich_text" jsonb;
  ALTER TABLE "_question_v" ADD COLUMN "version_overall_question_rich_text" jsonb;
  ALTER TABLE "_question_v_rels" ADD COLUMN "aspect_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "aspect_id" integer;
  ALTER TABLE "question_blocks_multiple_choice_answers" ADD CONSTRAINT "question_blocks_multiple_choice_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_blocks_multiple_choice"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_blocks_multiple_choice" ADD CONSTRAINT "question_blocks_multiple_choice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_blocks_self_report" ADD CONSTRAINT "question_blocks_self_report_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_blocks_free_text_validation" ADD CONSTRAINT "question_blocks_free_text_validation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "question_parts_solution_methods" ADD CONSTRAINT "question_parts_solution_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_multiple_choice_answers" ADD CONSTRAINT "_question_v_blocks_multiple_choice_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_blocks_multiple_choice"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_multiple_choice" ADD CONSTRAINT "_question_v_blocks_multiple_choice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_self_report" ADD CONSTRAINT "_question_v_blocks_self_report_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_blocks_free_text_validation" ADD CONSTRAINT "_question_v_blocks_free_text_validation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_version_parts_solution_methods" ADD CONSTRAINT "_question_v_version_parts_solution_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_question_v_version_parts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_blocks_multiple_choice_answers_order_idx" ON "question_blocks_multiple_choice_answers" USING btree ("_order");
  CREATE INDEX "question_blocks_multiple_choice_answers_parent_id_idx" ON "question_blocks_multiple_choice_answers" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_multiple_choice_order_idx" ON "question_blocks_multiple_choice" USING btree ("_order");
  CREATE INDEX "question_blocks_multiple_choice_parent_id_idx" ON "question_blocks_multiple_choice" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_multiple_choice_path_idx" ON "question_blocks_multiple_choice" USING btree ("_path");
  CREATE INDEX "question_blocks_self_report_order_idx" ON "question_blocks_self_report" USING btree ("_order");
  CREATE INDEX "question_blocks_self_report_parent_id_idx" ON "question_blocks_self_report" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_self_report_path_idx" ON "question_blocks_self_report" USING btree ("_path");
  CREATE INDEX "question_blocks_free_text_validation_order_idx" ON "question_blocks_free_text_validation" USING btree ("_order");
  CREATE INDEX "question_blocks_free_text_validation_parent_id_idx" ON "question_blocks_free_text_validation" USING btree ("_parent_id");
  CREATE INDEX "question_blocks_free_text_validation_path_idx" ON "question_blocks_free_text_validation" USING btree ("_path");
  CREATE INDEX "question_parts_solution_methods_order_idx" ON "question_parts_solution_methods" USING btree ("_order");
  CREATE INDEX "question_parts_solution_methods_parent_id_idx" ON "question_parts_solution_methods" USING btree ("_parent_id");
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
  CREATE UNIQUE INDEX "aspect_name_idx" ON "aspect" USING btree ("name");
  CREATE INDEX "aspect_updated_at_idx" ON "aspect" USING btree ("updated_at");
  CREATE INDEX "aspect_created_at_idx" ON "aspect" USING btree ("created_at");
  ALTER TABLE "question_rels" ADD CONSTRAINT "question_rels_aspect_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_question_v_rels" ADD CONSTRAINT "_question_v_rels_aspect_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_aspect_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_rels_aspect_id_idx" ON "question_rels" USING btree ("aspect_id");
  CREATE INDEX "_question_v_rels_aspect_id_idx" ON "_question_v_rels" USING btree ("aspect_id");
  CREATE INDEX "payload_locked_documents_rels_aspect_id_idx" ON "payload_locked_documents_rels" USING btree ("aspect_id");
  ALTER TABLE "question_parts" DROP COLUMN "prompt";
  ALTER TABLE "question_parts" DROP COLUMN "response_type";
  ALTER TABLE "question_parts" DROP COLUMN "response_multiple_choice_shuffle";
  ALTER TABLE "question" DROP COLUMN "prompt";
  ALTER TABLE "question_rels" DROP COLUMN "sub_topic_id";
  ALTER TABLE "_question_v_version_parts" DROP COLUMN "prompt";
  ALTER TABLE "_question_v_version_parts" DROP COLUMN "response_type";
  ALTER TABLE "_question_v_version_parts" DROP COLUMN "response_multiple_choice_shuffle";
  ALTER TABLE "_question_v" DROP COLUMN "version_prompt";
  ALTER TABLE "_question_v_rels" DROP COLUMN "sub_topic_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "topic_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sub_topic_id";
  DROP TYPE "public"."enum_question_parts_response_type";
  DROP TYPE "public"."enum__question_v_version_parts_response_type";`)
}
