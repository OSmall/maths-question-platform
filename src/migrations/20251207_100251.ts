import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "question_parts_solution_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"solution_rich_text" jsonb NOT NULL
  );
  
  ALTER TABLE "question_parts_solution_methods" ADD CONSTRAINT "question_parts_solution_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."question_parts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "question_parts_solution_methods_order_idx" ON "question_parts_solution_methods" USING btree ("_order");
  CREATE INDEX "question_parts_solution_methods_parent_id_idx" ON "question_parts_solution_methods" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "question_parts_solution_methods" CASCADE;`)
}
