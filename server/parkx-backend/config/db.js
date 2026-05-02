import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const connectionString = String(process.env.DATABASE_URL || "").trim();
const useSsl =
  /sslmode=require/i.test(connectionString) ||
  /neon\.tech/i.test(connectionString) ||
  String(process.env.DB_SSL || "").toLowerCase() === "true";

const enableChannelBinding =
  /channel_binding=require/i.test(connectionString) ||
  String(process.env.DB_CHANNEL_BINDING || "").toLowerCase() === "true";

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      enableChannelBinding,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    };

const pool = new Pool(poolConfig);

export const checkDatabaseConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL Connected Successfully", {
      mode: connectionString ? "DATABASE_URL" : "DB_HOST",
    });
  } finally {
    client.release();
  }
};

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;
