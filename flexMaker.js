// 기본 JSON 구조 생성
function startJSON() {
  return {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [],
        },
      },
    ],
  };
}

// 제목 추가 함수
function addHeadLine(json, text, align = "start") {
  json.contents[0].body.contents.push({
    layout: "horizontal",
    type: "box",
    contents: [
      {
        text: text,
        type: "text",
        weight: "bold",
        align: align,
        size: "xl",
      },
    ],
  });
  return json;
}

// 구분선 추가 함수sss
function addSeparator(json, color) {
  json.contents[0].body.contents.push({
    type: "separator",
    color: color,
    margin: "md",
  });
  return json;
}

// 정보 라인 추가 함수 (제목 + 값)
function addInfoLine(json, title, value) {
  json.contents[0].body.contents.push({
    layout: "horizontal",
    type: "box",
    contents: [
      {
        layout: "vertical",
        type: "box",
        contents: [
          {
            text: title,
            type: "text",
            align: "start",
            gravity: "center",
            size: "lg",
          },
        ],
      },
      {
        layout: "vertical",
        type: "box",
        contents: [
          {
            text: value,
            type: "text",

            gravity: "center",
            weight: "bold",
            size: "lg",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#000088",
        cornerRadius: "20px",
        paddingAll: "5px",
        width: "100px",
      },
    ],
    margin: "md",
  });
  return json;
}
function addSmallLine(json, title, value) {
  json.contents[0].body.contents.push({
    layout: "horizontal",
    type: "box",
    contents: [
      {
        layout: "vertical",
        type: "box",
        contents: [
          {
            text: title,
            type: "text",
            align: "start",
            gravity: "center",
            size: "md",
          },
        ],
      },
      {
        layout: "vertical",
        type: "box",
        contents: [
          {
            text: value,
            type: "text",
            align: "end",
            gravity: "center",
            weight: "bold",
            size: "md",
          },
        ],
      },
    ],
    margin: "sm",
    paddingStart: "10px",
  });
  return json;
}
function addTinyLine(json, title, value) {
  json.contents[0].body.contents.push({
    layout: "horizontal",
    type: "box",
    contents: [
      {
        layout: "vertical",
        type: "box",
        contents: [
          {
            text: title,
            type: "text",
            align: "start",
            gravity: "center",
            size: "sm",
          },
        ],
      },
      {
        layout: "vertical",
        type: "box",
        contents: [
          {
            text: value,
            type: "text",
            align: "end",
            gravity: "center",

            size: "sm",
          },
        ],
      },
    ],
    margin: "sm",
    paddingStart: "15px",
  });
  return json;
}

// 이미지 추가 함수
function addImage(json, imageUrl) {
  json.contents[0].hero = {
    type: "image",
    url: "https://previews.123rf.com/images/iconhome/iconhome2404/iconhome240400396/229128982-%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4-%EB%B6%84%EC%84%9D%EC%9D%98-%EB%B2%A1%ED%84%B0-%EB%94%94%EC%9E%90%EC%9D%B8%EC%9D%84-%EB%AC%98%EC%82%AC%ED%95%98%EB%8A%94-%ED%99%94%EC%82%B4%ED%91%9C%EA%B0%80-%EC%9E%88%EB%8A%94-%EC%84%B1%EC%9E%A5-%EC%B0%A8%ED%8A%B8.jpg",
    action: {
      type: "uri",
      uri: imageUrl,
    },
  };
  return json;
}

// 버튼 라인 추가 함수
function addButtonLine(json, label, data, displayText) {
  json.contents[0].body.contents.push({
    layout: "horizontal",
    type: "box",
    contents: [
      {
        action: {
          type: "postback",
          label: label,
          data: data,
          displayText: displayText,
        },
        type: "button",
        color: "#ffffff",
      },
    ],
    backgroundColor: "#000088",
    cornerRadius: "25px",
    width: "100%",
    height: "50px",
    spacing: "md",
    paddingAll: "0px",
    margin: "md",
  });
}
// 사용 예시:
function makeFlexMessage(jsList, imageUrl) {
  let json = startJSON();

  // 이미지 추가
  addImage(json, imageUrl);

  // 제목 추가
  addHeadLine(json, jsList.hospitalName, "center");

  // 부제목 추가
  addHeadLine(json, "월별실적");

  // 구분선 추가
  addSeparator(json, "#000000"); // action.type이 비어있어서 발생하는 오류로 인해 임시 주석 처리

  // 정보 라인들 추가
  jsList.sales.forEach((js) => {
    addInfoLine(json, js.yearmonth, js.sales);

    js.groups.forEach((group) => {
      const itemName = Object.keys(group)[0];
      addSmallLine(json, itemName, Object.values(group)[0]);

      js.dealers.forEach((dealer) => {
        const dealerName = Object.keys(dealer)[0];

        if (dealerName.includes(itemName)) {
          addTinyLine(json, Object.keys(dealer)[0], Object.values(dealer)[0]);
        }
      });
    });

    addSeparator(json, "#e1e1e1");
  });
  addButtonLine(json, "TESTBtn", "data1=1&data2=2", "");

  return json;
}

module.exports = { makeFlexMessage };
