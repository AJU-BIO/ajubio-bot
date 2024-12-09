const express = require("express");
const axios = require("axios");
const app = express();
const testRequest = require("./client");
// JSON 파싱을 위한 미들웨어
app.use(express.json());

// 메인 페이지
app.get("/", (req, res) => {
  // 쿼리 파라미터 파싱
  const queryParams = req.query;
  console.log("받은 쿼리 파라미터:", queryParams);

  res.send(`
    <h1>쿼리 파라미터 수신 완료</h1>
    <pre>${JSON.stringify(queryParams, null, 2)}</pre>
  `);

  const code = req.query.code;

  // code 값을 콘솔에 출력
  console.log("Code 파라미터:", code);
});

// 외부 API 요청 및 리다이렉트 테스트를 위한 엔드포인트
app.get("/request-test", async (req, res) => {
  try {
    // 쿼리 파라미터에서 code 값 추출
    // 응답 데이터를 쿼리 파라미터로 변환하여 리다이렉트
  } catch (error) {
    console.error("에러:", error);
    res.status(500).send("요청 처리 중 에러가 발생했습니다.");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  testRequest();
});
