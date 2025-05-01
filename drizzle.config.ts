import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

// Parse the connection string
const connectionString = process.env.DATABASE_URL!;
const url = new URL(connectionString);

export default {
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove the leading '/'
  },
} satisfies Config;
