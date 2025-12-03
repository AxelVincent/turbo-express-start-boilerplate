import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("email", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  // Create index on email for faster lookups
  await db.schema
    .createIndex("users_email_index")
    .on("users")
    .column("email")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
}
