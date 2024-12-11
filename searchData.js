const fs = require("fs");
const sql = require("mssql");
const { connectDB, closeConnection } = require("./connectDB");

// SQL 쿼리들을 저장할 객체
const sqlQueries = {};

// sql 폴더의 모든 .sql 파일 읽기
const sqlFiles = fs
  .readdirSync("./sql")
  .filter((file) => file.endsWith(".sql"));

// 각 SQL 파일의 내용을 객체에 저장
sqlFiles.forEach((file) => {
  const queryName = file.replace(".sql", ""); // 파일 확장자 제거
  const queryContent = fs.readFileSync(`./sql/${file}`, "utf8");
  sqlQueries[queryName] = queryContent;
});

async function getHospitalSales(hospitalName, csoEmail, monthCount) {
  const connection = await connectDB();
  const request = new sql.Request();
  request.input("hospitalName", sql.VarChar, hospitalName);
  request.input("abmail", sql.VarChar, csoEmail);
  request.input("monthCount", sql.Int, monthCount);
  const result = await request.query(sqlQueries.h_sales);
  await closeConnection(connection);
  return result.recordset;
}

// 테스트
// const hospitalName = "성빈센트";
// const csoEmail = "jeongjae.lee@ajubio.com";

// getHospitalSales(hospitalName, csoEmail, 6)
//   .then((results) => {
//     console.log(JSON.stringify(results, null, 2));
//   })
//   .catch((err) => {
//     console.error("에러:", err);
//   });

module.exports = { getHospitalSales };
