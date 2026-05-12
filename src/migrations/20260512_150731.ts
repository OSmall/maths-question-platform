import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'student');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  INSERT INTO "users_roles" ("order", "parent_id", "value")
  SELECT 0, "id", 'admin'::"public"."enum_users_roles"
  FROM "users";

  INSERT INTO "users_roles" ("order", "parent_id", "value")
  SELECT 1, "id", 'student'::"public"."enum_users_roles"
  FROM "users";

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "study_session" WHERE "user_id" IS NULL) THEN
      RAISE EXCEPTION 'Cannot require study_session.user_id while existing study sessions have no owner.';
    END IF;
  END $$;

  ALTER TABLE "study_session" ALTER COLUMN "user_id" SET NOT NULL;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_roles" CASCADE;
  ALTER TABLE "study_session" ALTER COLUMN "user_id" DROP NOT NULL;
  DROP TYPE "public"."enum_users_roles";`)
}
