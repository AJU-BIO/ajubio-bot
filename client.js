const config = require("./config");
const puppeteer = require("puppeteer");

async function testRequest() {
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
    console.error("에러:", error);
  }
}

module.exports = testRequest;
