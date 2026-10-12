import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: databaseUrl,

  ssl: isProduction
    ? { rejectUnauthorized: false }
    : databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : false,

  max: isProduction ? 3 : 10,

  idleTimeoutMillis: 10000,

  connectionTimeoutMillis: 10000,

  keepAlive: true,
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error);
});

export default pool;