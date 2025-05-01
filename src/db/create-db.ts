import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

async function createDatabase() {
  // Extract connection parts from the URL
  const connectionString = process.env.DATABASE_URL!;
  const url = new URL(connectionString);
  const dbName = url.pathname.slice(1); // Remove the leading '/'

  // Connect to the default 'postgres' database to create our application database
  const pgUrl = `postgres://${url.username}:${url.password}@${url.hostname}:${url.port}/postgres`;

  console.log(`Connecting to PostgreSQL to create database '${dbName}'...`);

  const client = postgres(pgUrl);

  try {
    // Check if database exists
    const result = await client`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

    if (result.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it now...`);
      // Create the database
      await client.unsafe(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully!`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (error) {
    console.error("Error creating database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
