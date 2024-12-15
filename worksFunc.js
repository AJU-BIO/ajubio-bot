const nAuth = require("./naverAuth");
const axios = require("axios");
const { getValFromDB } = require("./envDB/envDB");
const { connectDB, closeConnection } = require("./connDB");

async function usersList() {
  const getURL =
    "https://www.worksapis.com/v1.0/users?domainid=" +
    (await getValFromDB("DOMAIN_ID"));
  const accessToken = await nAuth.getAccessToken();

  const response = await axios.get(getURL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const json = response.data;

  const list = json.users.map((js) => {
    return {
      email: js.email,
      fullName: js.userName.lastName + js.userName.firstName,
      type: js.employmentTypeName,
      userID: js.userId,
      birthday: js.birthday,
      birthType: js.birthdayCalendarType,
      positionName: js.organizations[0].orgUnits[0].orgUnitName,
      //   area: js.task,
      //   position: js.organizations[0].orgUnits[0].positionName,
    };
  });
  //   console.log(list);
  return list;
}

async function findInfoByUserId(userId, infoKey) {
  const userList = await usersList();
  const userInfo = userList.filter((user) => user.userID === userId);

  if (userInfo.length == 1) {
    const val = userInfo[0][infoKey];
    console.log(val);
    return val;
  } else {
    return null;
  }
}

findInfoByUserId("93d8b36e-7f41-4f62-1e56-030922a1d863", "email");
