const dotenv = require("dotenv");
dotenv.config();

const { CLIENT_ID, AUTH_URL, ADMIN_ID, ADMIN_PW, CLIENT_SECRET } = process.env;

module.exports = {
  clientID: CLIENT_ID,
  authURL: AUTH_URL,
  username: ADMIN_ID,
  password: ADMIN_PW,
  clientSecret: CLIENT_SECRET,
};
