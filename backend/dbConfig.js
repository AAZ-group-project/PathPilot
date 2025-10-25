const { Pool } = require("pg");

// False if we are in development and true if we are in production
const isProduction = process.env.NODE_ENV === "production";

// Create a new pool object to connect to the database
const pool = isProduction
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_DATABASE,
    });

module.exports = { pool };
