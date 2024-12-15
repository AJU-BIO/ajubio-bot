const dotenv = require("dotenv");
dotenv.config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;
// 캐시 객체 생성

module.exports = {
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
