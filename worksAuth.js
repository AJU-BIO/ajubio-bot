const config = require("./config");
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs").promises;

async function visitAuthCodeGeneration() {
  try {
    const browser = await puppeteer.launch({ headless: false }); // 브라우저 동작을 확인하기 위해 headless: false
    const page = await browser.newPage();

    const redirectURL = "http://localhost:8080";
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
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 1초 대기

    // 리다이렉트된 URL에서 code 파라미터 추출을 위해 대기
    // await page.waitForNavigation({ waitUntil: "networkidle0" });

    // 현재 URL 가져오기
    const currentUrl = page.url();

    // URL에서 code 파라미터 추출
    const urlParams = new URL(currentUrl).searchParams;
    const authCode = urlParams.get("code");

    if (authCode) {
      console.log("인증 코드:", authCode);
    } else {
      console.log("인증 코드를 찾을 수 없습니다.");
    }
    // 필요한 경우 브라우저 종료
    await browser.close();

    return authCode;
  } catch (error) {
    console.error("에러:", error);
  }
}

async function makeRequest(url, payload) {
  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (e) {
    console.log("에러 상태 코드:", e.response?.status);
    console.log(
      "에러 메시지:",
      e.response?.data?.error_description || e.message
    );
    return null;
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
  const url = "https://auth.worksmobile.com/oauth2/v2.0/token";
  try {
    const tokenData = await makeRequest(url, payload);

    if (tokenData) {
      const { refresh_token, access_token } = tokenData;
      await updateEnvFile("ACCESS_TOKEN", access_token);
      await updateEnvFile("REFRESH_TOKEN", refresh_token);
    }
  } catch (e) {
    console.log(e);
  }
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

async function getAccessToken() {
  const reqURL = "https://auth.worksmobile.com/oauth2/v2.0/token";

  // .env 파일에서 refresh_token 읽기
  const refresh_token = process.env.REFRESH_TOKEN;

  let payload = {
    refresh_token: refresh_token,
    grant_type: "refresh_token",
    client_id: config.clientID,
    client_secret: config.clientSecret,
  };

  try {
    let response = await makeRequest(reqURL, payload);
    if (!response) {
      console.log("토큰 만료");
      const authCode = await visitAuthCodeGeneration();
      await getRefreshToken(authCode);
      (payload.refresh_token = process.env.REFRESH_TOKEN),
        (response = await makeRequest(reqURL, payload));
    }
    try {
      console.log(response);
      // 새로운 access token을 .env 파일에 저장
      await updateEnvFile("ACCESS_TOKEN", response.access_token);
      return response.access_token;
    } catch (e) {
      console.log(e);
    }
  } catch (error) {
    console.error("토큰 갱신 중 에러:", error);
    throw error;
  }
}

module.exports = { getRefreshToken, visitAuthCodeGeneration, getAccessToken };

// getAccessToken();
