const express = require("express");
const axios = require("axios");
const app = express();
const client = require("./client");
// JSON 파싱을 위한 미들웨어
app.use(express.json());

// 메인 페이지
app.get("/", (req, res) => {
  // 쿼리 파라미터 파싱

  res.send(`
    <h1>Hello World</h1>
  `);

  const code = req.query.code || "justVisit";

  // code 값을 콘솔에 출력
  if (code !== "justVisit" && code.endsWith("==")) {
    // console.log(code);

    client.getRefreshToken(code);
  }
});

// 외부 API 요청 및 리다이렉트 테스트를 위한 엔드포인트

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  // client.visitAuthCodeGeneration();
});
