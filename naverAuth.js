const axios = require("axios");
const puppeteer = require("puppeteer");
const { connectDB, closeConnection } = require("./connDB");
const { getValFromDB, setValIntoDB } = require("./envDB/envDB");

async function getAccessToken() {
  const connection = await connectDB();
  const refresh_pre_token = await getValFromDB("REFRESH_TOKEN", connection);
  const clientID = await getValFromDB("CLIENT_ID", connection);
  const clientSecret = await getValFromDB("CLIENT_SECRET", connection);
  await closeConnection();

  const payload = {
    grant_type: "refresh_token",
    client_id: clientID,
    client_secret: clientSecret,
    refresh_token: refresh_pre_token,
  };

  const reqURL = "https://auth.worksmobile.com/oauth2/v2.0/token";
  let response = await makeRequest(reqURL, payload);
  console.log(response);
  while (!response) {
    console.log("refresh오류");
    await getRefreshToken();
    payload.refresh_token = await getValFromDB("REFRESH_TOKEN");
    response = await makeRequest(reqURL, payload);
  }

  const { access_token } = response;
  await setValIntoDB("ACCESS_TOKEN", access_token);

  return access_token;
}

async function getRefreshToken() {
  const connection = await connectDB();
  const params = {
    clientID: await getValFromDB("CLIENT_ID", connection),
    clientSecret: await getValFromDB("CLIENT_SECRET", connection),
  };
  await closeConnection();
  const payload = {
    code: await getAuthCode(),
    grant_type: "authorization_code",
    client_id: params.clientID,
    client_secret: params.clientSecret,
  };

  // console.log(payload);
  const url = "https://auth.worksmobile.com/oauth2/v2.0/token";
  try {
    const tokenData = await makeRequest(url, payload);

    if (tokenData) {
      const { refresh_token, access_token } = tokenData;
      await setValIntoDB("ACCESS_TOKEN", access_token);
      await setValIntoDB("REFRESH_TOKEN", refresh_token);
    }
  } catch (e) {
    console.log(e);
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

async function getAuthCode() {
  try {
    const browser = await puppeteer.launch({ headless: true }); // 브라우저 동작을 확인하기 위해 headless: false
    const page = await browser.newPage();
    const connection = await connectDB();

    const params = {
      authURL: await getValFromDB("AUTH_URL", connection),
      clientID: await getValFromDB("CLIENT_ID", connection),
      redirectURL: await getValFromDB("REDIRECT_URL", connection),
      username: await getValFromDB("ADMIN_ID", connection),
      password: await getValFromDB("ADMIN_PW", connection),
    };

    await closeConnection();
    const url =
      params.authURL +
      `&client_id=${params.clientID}&redirect_uri=${params.redirectURL}`;

    // 페이지 이동
    await page.goto(url);

    // ID, PASSWORD 입력 (실제 선택자로 변경 필요)
    await page.waitForSelector("#user_id"); // ID 입력 필드의 선택자
    await page.type("#user_id", params.username);

    await page.waitForSelector("#user_pwd"); // 비밀번호 입력 필드의 선택자
    await page.type("#user_pwd", params.password);

    // 로그인 버튼 클릭
    await page.click("#loginBtn"); // 로그인 버튼의 선택자

    // 로그인 후 리다이렉트 대기
    // await page.waitForNavigation();

    console.log("로그인 성공!");

    const currentUrl = page.url();
    console.log("리다이렉트된 URL:", currentUrl);

    // URL에서 code 파라미터 추출
    const urlParams = new URL(currentUrl).searchParams;
    const authCode = urlParams.get("code");

    if (!authCode) {
      console.log("인증 코드를 찾을 수 없습니다.");
      throw new Error("인증 코드를 찾을 수 없습니다");
    }

    // 브라우저 종료
    await browser.close();
    console.log("인증 코드:", authCode);
    return authCode;
  } catch (error) {
    console.error("에러:", error);
    throw error;
  }
}

module.exports = { getAccessToken };
