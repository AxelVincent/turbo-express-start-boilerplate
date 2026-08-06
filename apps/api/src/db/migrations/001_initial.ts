import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  // Users table (application data)
  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("email", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute()

  await db.schema
    .createIndex("users_email_index")
    .on("users")
    .column("email")
    .execute()

  // Better Auth core tables
  await db.schema
    .createTable("user")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("email_verified", "boolean", (col) => col.notNull())
    .addColumn("image", "text")
    .addColumn("role", "text", (col) => col.notNull().defaultTo("user"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute()

  await db.schema
    .createTable("session")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("token", "text", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) => col.notNull())
    .addColumn("ip_address", "text")
    .addColumn("user_agent", "text")
    .addColumn("user_id", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("active_organization_id", "text")
    .execute()

  await db.schema
    .createIndex("session_user_id_idx")
    .on("session")
    .column("user_id")
    .execute()

  await db.schema
    .createTable("account")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("account_id", "text", (col) => col.notNull())
    .addColumn("provider_id", "text", (col) => col.notNull())
    .addColumn("user_id", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("access_token", "text")
    .addColumn("refresh_token", "text")
    .addColumn("id_token", "text")
    .addColumn("access_token_expires_at", "timestamptz")
    .addColumn("refresh_token_expires_at", "timestamptz")
    .addColumn("scope", "text")
    .addColumn("password", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex("account_user_id_idx")
    .on("account")
    .column("user_id")
    .execute()

  await db.schema
    .createTable("verification")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("identifier", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute()

  await db.schema
    .createIndex("verification_identifier_idx")
    .on("verification")
    .column("identifier")
    .execute()

  // Better Auth organization plugin tables
  await db.schema
    .createTable("organization")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("logo", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("metadata", "text")
    .execute()

  await db.schema
    .createTable("member")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("user_id", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("role", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute()

  await db.schema
    .createIndex("member_organization_id_idx")
    .on("member")
    .column("organization_id")
    .execute()
  await db.schema
    .createIndex("member_user_id_idx")
    .on("member")
    .column("user_id")
    .execute()

  await db.schema
    .createTable("invitation")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("organization_id", "text", (col) =>
      col.notNull().references("organization.id").onDelete("cascade"),
    )
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("role", "text")
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("inviter_id", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createIndex("invitation_email_idx")
    .on("invitation")
    .column("email")
    .execute()
  await db.schema
    .createIndex("invitation_organization_id_idx")
    .on("invitation")
    .column("organization_id")
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("invitation").ifExists().execute()
  await db.schema.dropTable("member").ifExists().execute()
  await db.schema.dropTable("organization").ifExists().execute()
  await db.schema.dropTable("verification").ifExists().execute()
  await db.schema.dropTable("account").ifExists().execute()
  await db.schema.dropTable("session").ifExists().execute()
  await db.schema.dropTable("user").ifExists().execute()
  await db.schema.dropTable("users").ifExists().execute()
}
