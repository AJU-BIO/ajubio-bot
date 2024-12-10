const client = require("./client");
const axios = require("axios");
const config = require("./config");
const searchData = require("./searchData");

async function sendMessage(
  msg,
  userID = "73524122-e756-4c53-179e-0378b4ad90b5"
) {
  try {
    const rawData = await searchData.getHospitalSales(
      "성빈센트",
      "jeongjae.lee@ajubio.com"
    );
    console.log("DB에서 받은 원본 데이터:", rawData);

    if (!rawData || !rawData.data || rawData.data.length === 0) {
      console.log("데이터 없음:", rawData);
      return {
        content: {
          type: "text",
          text: "조회된 데이터가 없습니다.",
        },
      };
    }

    const processedData = {
      message: "월별 실적 현황입니다.",
      data: rawData.data.map((record) => ({
        yearMonth: `${record.년}년 ${record.월}월`,
        병원명: record.병원명,
        병원종별: record.병원종별,
        총매출액: String(record.월별총매출금액 || 0),
        품목군: record.품목군 || "미분류",
        CSO딜러명: record.CSO딜러명 || "미지정",
        매출액: String(record.월별총매출금액 || 0),
      })),
    };

    console.log("가공된 데이터:", processedData);

    const payload = makeMessageTemplate(processedData);
    console.log("최종 메시지 템플릿:", payload);

    return await fetcher(userID, payload);
  } catch (error) {
    console.error("메시지 전송 중 오류 발생:", error);
    return {
      content: {
        type: "text",
        text: "데이터 처리 중 오류가 발생했습니다.",
      },
    };
  }
}

async function fetcher(uid, payload) {
  const botId = config.botId;

  const postURL = `https://www.worksapis.com/v1.0/bots/${botId}/users/${uid}/messages`;
  const header = {
    Authorization: `Bearer ${await client.getAccessToken()}`,
    "Content-Type": "application/json",
  };
  const response = await axios.post(postURL, payload, {
    headers: header,
  });

  return response.data;
}

async function postHandler(req) {
  req = {
    type: "message",
    source: {
      userId: "73524122-e756-4c53-179e-0378b4ad90b5",
      domainId: 300118260,
    },
    issuedTime: "2024-12-10T10:14:37.77Z",
    content: { type: "text", text: "/병원 아주대" },
  };

  const uid = req.source.userId;
  const msg = req.content.text;
  const type = req.type;

  if (type === "message") {
    if (msg.startsWith("/병원")) {
      const hospitalName = msg.split(" ")[1].trim();
      console.log(hospitalName);
    }
  }
}

const makeMessageTemplate = (data) => {
  console.log("받은 데이터:", data);

  if (
    !data ||
    !data.data ||
    !Array.isArray(data.data) ||
    data.data.length === 0
  ) {
    return {
      content: {
        type: "text",
        text: "조회된 데이터가 없습니다.",
      },
    };
  }

  return {
    content: {
      type: "flex",
      altText: "월별 매출 현황",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            // 제목
            {
              type: "text",
              text: data.data[0].hospitalName || "병원명 없음",
              weight: "bold",
              color: "#1DB446",
              size: "sm",
            },
            {
              type: "text",
              text: "월별 매출 현황 (단위: 백만원)",
              weight: "bold",
              size: "md",
              margin: "md",
            },
            // 월별 데이터
            ...data.data
              .map((monthData, index) => {
                console.log("처리중인 월별 데이터:", monthData);
                return [
                  // 구분선 (첫 번째 항목 제외)
                  ...(index > 0
                    ? [
                        {
                          type: "separator",
                          margin: "xxl",
                        },
                      ]
                    : []),
                  // 월 표시
                  {
                    type: "text",
                    text: monthData.yearMonth || "날짜 없음",
                    size: "sm",
                    color: "#555555",
                    margin: "md",
                  },
                  // 총매출액
                  {
                    type: "box",
                    layout: "horizontal",
                    margin: "sm",
                    contents: [
                      {
                        type: "text",
                        text: "총매출액",
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: monthData.총매출액 || "0.0",
                        size: "sm",
                        color: "#111111",
                        align: "end",
                        flex: 1,
                      },
                    ],
                  },
                  // 품목군별 실적
                  {
                    type: "text",
                    text: "품목군별 실적",
                    weight: "bold",
                    size: "sm",
                    margin: "lg",
                  },
                  ...(monthData.품목군별실적 || []).map((item) => ({
                    type: "box",
                    layout: "horizontal",
                    margin: "sm",
                    contents: [
                      {
                        type: "text",
                        text: item.품목군 || "미분류",
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: item.매출액 || "0.0",
                        size: "sm",
                        color: "#111111",
                        align: "end",
                        flex: 1,
                      },
                    ],
                  })),
                  // 품목군-CSO별 실적
                  {
                    type: "text",
                    text: "품목군-CSO별 실적",
                    weight: "bold",
                    size: "sm",
                    margin: "lg",
                  },
                  ...(monthData.품목CSO실적 || []).map((item) => ({
                    type: "box",
                    layout: "horizontal",
                    margin: "sm",
                    contents: [
                      {
                        type: "text",
                        text: `${item.품목군 || "미분류"} - ${
                          item.CSO딜러명 || "미지정"
                        }`,
                        size: "sm",
                        color: "#555555",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: item.매출액 || "0.0",
                        size: "sm",
                        color: "#111111",
                        align: "end",
                        flex: 1,
                      },
                    ],
                  })),
                ];
              })
              .flat(),
          ],
        },
      },
    },
  };
};

sendMessage();
