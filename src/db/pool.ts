import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
});

pool.on("connect", () => {
  console.log("PostgreSQL client connected successfully");
});

pool.on("error", (err: Error) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

export const checkDatabaseConnection = async () => {
  const result = await pool.query("SELECT NOW()");
  return result.rows[0];
};

export default pool;