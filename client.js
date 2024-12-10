const config = require("./config");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs").promises;

async function visitAuthCodeGeneration() {
  try {
    const browser = await puppeteer.launch({ headless: false }); // 브라우저 동작을 확인하기 위해 headless: false
    const page = await browser.newPage();

    const redirectURL = "http://localhost:3000&";
    const url =
      config.authURL +
      `&client_id=${config.clientID}&redirect_uri=${redirectURL}`;

    // 페이지 이동
    await page.goto(url);

    // ID, PASSWORD 입력 (실제 선택자로 변경 필요)
    await page.waitForSelector("#user_id"); // ID 입력 필드의 선택자
    await page.type("#user_id", config.username);

    await page.waitForSelector("#user_pwd"); // 비밀번호 입력 필드의 선택자
    await page.type("#user_pwd", config.password);

    // 로그인 버튼 클릭
    await page.click("#loginBtn"); // 로그인 버튼의 선택자

    // 로그인 후 리다이렉트 대기
    // await page.waitForNavigation();

    console.log("로그인 성공!");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
    // 필요한 경우 브라우저 종료
    await browser.close();
  } catch (error) {
    // console.error("에러:", error);
  }
}

async function getRefreshToken(code) {
  const payload = {
    code: code,
    grant_type: "authorization_code",
    client_id: config.clientID,
    client_secret: config.clientSecret,
  };

  // console.log(payload);
  try {
    const response = await axios.post(
      "https://auth.worksmobile.com/oauth2/v2.0/token",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { refresh_token, access_token } = await response.data;

    await updateEnvFile("ACCESS_TOKEN", access_token);
    await updateEnvFile("REFRESH_TOKEN", refresh_token);
  } catch (e) {
    console.log(e);
  }

  // axios의 응답에서 data 속성이 이미 파싱된 JSON 객체를 반환합니다.
  // response.data를 사용하는 것이 맞습니다.

  // console.log(response.data);
}

async function updateEnvFile(key, value) {
  try {
    // .env 파일 읽기
    let envContent = await fs.readFile(".env", "utf-8");

    // 기존 값이 있는지 확인
    const regex = new RegExp(`^${key}=.*$`, "m");

    if (envContent.match(regex)) {
      // 기존 값 수정
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // 새로운 값 추가
      envContent += `\n${key}=${value}`;
    }

    // 파일 저장
    await fs.writeFile(".env", envContent);
    console.log(`${key} 값이 성공적으로 업데이트되었습니다.`);

    // 환경변수 즉시 적용
    process.env[key] = value;
  } catch (error) {
    console.error("ENV 파일 수정 중 에러:", error);
  }
}

// 사용 예시:
// await updateEnvFile('ACCESS_TOKEN', '새로운토큰값');

module.exports = { getRefreshToken, visitAuthCodeGeneration };
