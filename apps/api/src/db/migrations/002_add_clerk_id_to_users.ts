import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("clerk_id", "varchar(255)", (col) => col.unique())
    .execute();

  // Create index on clerk_id for faster lookups
  await db.schema
    .createIndex("users_clerk_id_index")
    .on("users")
    .column("clerk_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .dropColumn("clerk_id")
    .execute();
}
