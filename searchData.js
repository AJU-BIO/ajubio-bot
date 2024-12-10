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

async function getHospitalSales(hospitalName, csoEmail) {
  try {
    const sqlQuery = sqlQueries["h_sales"];
    const pool = await connectDB();

    const request = pool.request();
    request.input("병원명", sql.NVarChar, hospitalName);
    request.input("CSO_AB메일", sql.NVarChar, csoEmail);

    const result = await request.query(sqlQuery);
    console.log("[1] DB 쿼리 원본 결과:", result.recordset);

    if (!result.recordset || result.recordset.length === 0) {
      return {
        data: [],
        message: "조회결과없음",
      };
    }

    // 월별 데이터 그룹화
    const monthlyGroups = {};
    result.recordset.forEach((record) => {
      const yearMonth = `${record.년}년 ${record.월}월`;

      if (!monthlyGroups[yearMonth]) {
        monthlyGroups[yearMonth] = {
          yearMonth,
          총매출액: 0,
          품목군별실적: [],
          품목CSO실적: [],
        };
      }

      // 총매출액 처리
      monthlyGroups[yearMonth].총매출액 =
        Number(record.월별총매출금액) / 1000000;

      // 품목군별 실적 처리
      const existingProduct = monthlyGroups[yearMonth].품목군별실적.find(
        (item) => item.품목군 === record.품목군
      );
      if (!existingProduct) {
        monthlyGroups[yearMonth].품목군별실적.push({
          품목군: record.품목군,
          매출액: (Number(record.월별총매출금액) / 1000000).toFixed(1),
        });
      }

      // 품목군-CSO별 실적 처리
      const existingCSO = monthlyGroups[yearMonth].품목CSO실적.find(
        (item) =>
          item.품목군 === record.품목군 && item.CSO딜러명 === record.CSO딜러명
      );
      if (!existingCSO) {
        monthlyGroups[yearMonth].품목CSO실적.push({
          품목군: record.품목군,
          CSO딜러명: record.CSO딜러명,
          매출액: (Number(record.월별총매출금액) / 1000000).toFixed(1),
        });
      }
    });

    // 최종 데이터 배열로 변환
    const finalData = Object.values(monthlyGroups).map((month) => ({
      yearMonth: month.yearMonth,
      총매출액: month.총매출액.toFixed(1),
      품목군별실적: month.품목군별실적,
      품목CSO실적: month.품목CSO실적,
    }));

    console.log("[2] 최종 데이터:", finalData);

    return {
      data: finalData,
      message: "조회 성공",
    };
  } catch (error) {
    console.error("[ERROR] DB 쿼리 오류:", error);
    throw error;
  }
}

function formatHospitalSales(results) {
  const salesByCategory = {};

  results.forEach((row) => {
    const category = row.category || "기타";
    if (!salesByCategory[category]) {
      salesByCategory[category] = {
        quantity: 0,
        amount: 0,
      };
    }
    salesByCategory[category].quantity += row.quantity || 0;
    salesByCategory[category].amount += row.amount || 0;
  });

  // 집계된 데이터를 형식에 맞게 변환
  const formattedData = Object.entries(salesByCategory).map(
    ([category, data]) => ({
      name: category,
      quantity: data.quantity.toString(),
      amount: data.amount.toLocaleString(),
    })
  );

  return formattedData;
}

// 테스트
const hospitalName = "성빈센트";
const csoEmail = "jeongjae.lee@ajubio.com";

getHospitalSales(hospitalName, csoEmail)
  .then((results) => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch((err) => {
    console.error("에러:", err);
  });

module.exports = { getHospitalSales };
