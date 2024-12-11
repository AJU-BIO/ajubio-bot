const client = require("./client");
const axios = require("axios");
const config = require("./config");
const searchData = require("./searchData");

async function sendHospitalInfo(
  hospitalName,
  csoEmail,
  monthCount,
  uid = "73524122-e756-4c53-179e-0378b4ad90b5"
) {
  const hospitalInfo = await searchData.getHospitalSales(
    hospitalName,
    csoEmail,
    monthCount
  );

  if (!hospitalInfo || hospitalInfo.length === 0) {
    await fetcher(uid, {
      content: {
        type: "text",
        text: "조회 결과가 없거나 권한이 없습니다.",
      },
    });
    return;
  }

  console.log(hospitalInfo);

  const monthlySales = hospitalInfo.reduce((acc, info) => {
    const ym = `${info.year % 100}년${info.month}월`;
    const existingEntry = acc.find((item) => item.ym === ym);
    if (existingEntry) {
      existingEntry.total += info.total / 1000000;
      existingEntry.sales = `${existingEntry.total.toFixed(1)}백만`;
    } else {
      acc.push({
        ym,
        total: info.total / 1000000,
        sales: `${(info.total / 1000000).toFixed(1)}백만`,
      });
    }
    return acc;
  }, []);

  const roundedMonthlySales = monthlySales.map((item) => ({
    ...item,
    total: Number(item.total.toFixed(1)),
  }));

  // 월별 데이터 정렬 (연도와 월을 고려)
  const sortedSales = roundedMonthlySales.sort((a, b) => {
    const [yearA, monthA] = a.ym.split("년").map((v) => parseInt(v));
    const [yearB, monthB] = b.ym.split("년").map((v) => parseInt(v));
    if (yearA !== yearB) return yearA - yearB;
    return parseInt(monthA) - parseInt(monthB);
  });

  const labels = sortedSales.map((item) => item.ym);
  const values = sortedSales.map((item) => item.total);

  const chartConfig = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          borderColor: "rgb(29, 45, 122)",
          backgroundColor: "rgb(29, 45, 122)",
          fill: false,
          tension: 0.4,
          datalabels: {
            align: "top",
            anchor: "end",
          },
        },
      ],
    },
    options: {
      backgroundColor: "white",
      aspectRatio: 3,
      legend: {
        display: false,
      },
      plugins: {
        datalabels: {
          color: "#666",
          font: {
            weight: "bold",
          },
        },
      },
      scales: {
        xAxes: [
          {
            ticks: {
              color: "#666",
            },
          },
        ],
        yAxes: [
          {
            display: false,
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  };

  // 이스케이프 문자 처리를 위해 JSON.stringify 결과를 한번 더 파싱
  const chartConfigStr = JSON.stringify(chartConfig);
  const parsedConfig = JSON.parse(chartConfigStr);
  const imgURL = `https://quickchart.io/chart?c=${encodeURIComponent(
    JSON.stringify(parsedConfig)
  )}`;

  // console.log(imgURL);

  const hosName = hospitalInfo[0].hospital;
  const year = hospitalInfo[0].year;
  const month = hospitalInfo[0].month;

  const recentSales = hospitalInfo.filter((js) => {
    // 최근 3개월 데이터만 필터링
    if (js.year === year) {
      // 같은 연도인 경우
      return js.month > month - 3 && js.month <= month;
    } else if (js.year === year - 1) {
      // 전년도인 경우 (연말~연초 걸친 경우)
      return js.month > 12 - (3 - month);
    }
    return false;
  });

  // 월별 매출 데이터 구성
  const monthlyResults = recentSales.reduce((acc, js) => {
    const yearMonth = `${js.year % 100}년${js.month
      .toString()
      .padStart(2, "0")}월`;

    if (!acc[yearMonth]) {
      acc[yearMonth] = {
        sales: 0,
        groups: {},
        dealers: [],
      };
    }

    // 전체 매출 합계
    acc[yearMonth].sales += js.total / 1000000;

    // 품목군별 매출
    if (!acc[yearMonth].groups[js.productGroup]) {
      acc[yearMonth].groups[js.productGroup] = 0;
    }
    acc[yearMonth].groups[js.productGroup] += js.total / 1000000;

    // 딜러별 매출
    const dealer = js.dealer || "기타";
    const dealerKey = `${js.productGroup}-${dealer}`;
    if (!acc[yearMonth].dealers) {
      acc[yearMonth].dealers = {};
    }
    if (!acc[yearMonth].dealers[dealerKey]) {
      acc[yearMonth].dealers[dealerKey] = 0;
    }
    acc[yearMonth].dealers[dealerKey] += js.total / 1000000;

    return acc;
  }, {});

  // 최종 결과 포맷팅
  const formattedResults = Object.entries(monthlyResults).map(
    ([yearMonth, data]) => {
      // 품목군 정렬 및 상위 9개 + 기타 처리
      const sortedGroups = Object.entries(data.groups).sort(
        (a, b) => b[1] - a[1]
      );

      let processedGroups;
      if (sortedGroups.length > 9) {
        const top9 = sortedGroups.slice(0, 9);
        const othersSum = sortedGroups
          .slice(9)
          .reduce((sum, [_, sales]) => sum + sales, 0);

        processedGroups = [
          ...top9.map(([group, sales]) => ({
            [group]: sales.toFixed(1),
          })),
          { 기타: othersSum.toFixed(1) },
        ];
      } else {
        processedGroups = sortedGroups.map(([group, sales]) => ({
          [group]: sales.toFixed(1),
        }));
      }

      return {
        yearmonth: yearMonth,
        sales: data.sales.toFixed(1),
        groups: processedGroups,
        dealers: Object.entries(data.dealers).map(([key, sales]) => ({
          [key]: sales.toFixed(1),
        })),
      };
    }
  );

  const data = {
    hospitalName: hosName,
    year: year,
    month: month,
    sales: formattedResults,
  };

  const payload = {
    content: {
      type: "flex",
      altText: `${hosName} 실적현황`,
      contents: genPayload(data, imgURL),
    },
  };
  console.log(JSON.stringify(payload, null, 2));
  // fetcher(uid, payload);
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

function genPayload(jsList, imgURL) {
  return {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        styles: {
          hero: {
            backgroundColor: "#ffffff",
          },
        },
        hero: {
          url: imgURL,
          action: {
            type: "",
          },
          type: "image",
          aspectMode: "fit",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `${jsList.hospitalName} 실적현황`,
              weight: "bold",
              size: "xl",
            },
            {
              layout: "horizontal",
              action: {
                type: "",
              },
              type: "box",
              contents: jsList.sales.map((js) => {
                console.log(js.yearmonth);
                return (
                  {
                    type: "text",
                    text: `${js.yearmonth} 실적:`,
                    margin: "xxl",
                    size: "md",
                    gravity: "center",
                    align: "center",
                  },
                  {
                    layout: "vertical",
                    action: {
                      type: "",
                    },
                    type: "box",
                    contents: [
                      {
                        text: js.sales,
                        action: {
                          type: "",
                        },
                        type: "text",
                        size: "xl",
                        align: "center",
                        gravity: "center",
                      },
                    ],
                  }
                );
              }),
            },
            {
              type: "separator",
              color: "#888888",
              margin: "lg",
            },
            {
              layout: "vertical",
              action: {
                type: "",
              },
              type: "box",
              contents: [
                {
                  layout: "vertical",
                  action: {
                    type: "",
                  },
                  type: "box",
                  contents: [
                    {
                      text: "월별 품목군별 실적",
                      action: {
                        type: "",
                      },
                      type: "text",
                      margin: "lg",
                    },
                    {
                      layout: "vertical",
                      action: {
                        type: "",
                      },
                      type: "box",
                    },
                  ],
                },
                ...jsList.sales.map((js) => {
                  return {
                    layout: "horizontal",
                    action: {
                      type: "",
                    },
                    type: "box",
                    contents: js.groups.map((jjs) => {
                      return (
                        {
                          layout: "horizontal",
                          action: {
                            type: "",
                          },
                          type: "box",
                          contents: [
                            {
                              text: `${js.yearmonth} | ${jjs.key}:`,
                              action: {
                                type: "",
                              },
                              type: "text",
                            },
                          ],
                        },
                        {
                          layout: "horizontal",
                          action: {
                            type: "",
                          },
                          type: "box",
                          contents: [
                            {
                              text: jjs.value,
                              action: {
                                type: "",
                              },
                              type: "text",
                              align: "end",
                            },
                          ],
                        }
                      );
                    }),
                  };
                }),
              ],
              margin: "xl",
            },
          ],
        },
      },
    ],
  };
}

sendHospitalInfo("성빈센트", "jeongjae.lee@ajubio.com", 6);
