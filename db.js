/** Database setup for BizTime. */

const { Client } = require("pg");

const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = `postgresql://${DB_USER}:${DB_PASS}@localhost:5432/biztime_test`;
} else {
  DB_URI = `postgresql://${DB_USER}:${DB_PASS}@localhost:5432/biztime`;
}

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;


