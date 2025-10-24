//Gets the variables form the .env file 
require("dotenv").config()

//Gets the pg module as Pool
const { Pool } = require("pg")

//False if we are in development and true if we are in production
const isProduction = process.env.NODE_ENV === "production";

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.dB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

//checks if we are in production to see which database to use
const pool = new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : connectionString
})

module.exports = { pool }