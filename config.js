const dotenv = require("dotenv");
dotenv.config();

const {
  CLIENT_ID,
  AUTH_URL,
  ADMIN_ID,
  ADMIN_PW,
  CLIENT_SECRET,
  BOT_ID,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_DATABASE,
} = process.env;

module.exports = {
  clientID: CLIENT_ID,
  authURL: AUTH_URL,
  username: ADMIN_ID,
  password: ADMIN_PW,
  clientSecret: CLIENT_SECRET,
  botId: BOT_ID,
  dbinfo: {
    server: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
};
