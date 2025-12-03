import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB as Database } from "./types";

let db: Kysely<Database> | null = null;

export const createDatabase = (): Kysely<Database> => {
  if (db) {
    return db;
  }

  const dialect = new PostgresDialect({
    pool: new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      max: 10,
    }),
  });

  db = new Kysely<Database>({
    dialect,
  });

  return db;
};

export const getDatabase = (): Kysely<Database> => {
  if (!db) {
    throw new Error("Database not initialized. Call createDatabase() first.");
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.destroy();
    db = null;
  }
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const database = getDatabase();
    await database.selectFrom("users").select("id").limit(1).execute();
    return true;
  } catch (error) {
    return false;
  }
};
