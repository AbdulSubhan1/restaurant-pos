import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

// For query purposes (SELECT, INSERT, UPDATE, DELETE)
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient);

// For migration purposes
export const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
