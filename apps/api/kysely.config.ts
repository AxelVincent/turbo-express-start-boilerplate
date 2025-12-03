import { defineConfig } from "kysely-ctl";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    }),
  }),
  migrations: {
    migrationFolder: "src/db/migrations",
  },
});
