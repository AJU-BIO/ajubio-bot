const sql = require("mssql");
const config = require("./config");

async function connectDB() {
  try {
    // DB 연결
    const pool = await sql.connect(config.dbinfo);
    console.log("데이터베이스 연결 성공");
    return pool;
  } catch (error) {
    console.error("데이터베이스 연결 실패:", error);
    throw error;
  }
}

// 연결 종료
async function closeConnection() {
  try {
    await sql.close();
    console.log("데이터베이스 연결 종료");
  } catch (error) {
    console.error("연결 종료 실패:", error);
    throw error;
  }
}

module.exports = {
  connectDB,
  closeConnection,
};
