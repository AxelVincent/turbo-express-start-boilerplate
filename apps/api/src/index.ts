import "dotenv/config";
import { createServer } from "./server";
import { logger } from "@repo/logger";
import { createDatabase } from "./db/database";

const port = process.env.PORT || 3001;

// Initialize database connection
createDatabase();
logger.info({ msg: "Database initialized", event: "database.initialized" });

const server = createServer();

server.listen(port, () => {
  logger.info({ msg: `api running on ${port}`, event: "api.running" });
});
