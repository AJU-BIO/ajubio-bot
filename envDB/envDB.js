const { connectDB, closeConnection } = require("../connDB");

const { encrypt, decrypt } = require("./cryptoUtils");

async function setValIntoDB(key, value) {
  const connection = await connectDB();
  const encryptedValue = encrypt(value);
  console.log(encryptedValue);

  // 기존 키가 있는지 확인
  const result = await connection
    .request()
    .input("key", key)
    .query("SELECT [key] FROM [dbo].[NaverWorks] WHERE [key] = @key");

  if (result.recordset.length > 0) {
    // 기존 키가 있으면 업데이트
    await connection
      .request()
      .input("key", key)
      .input("value", encryptedValue)
      .query(
        "UPDATE [dbo].[NaverWorks] SET [value] = @value WHERE [key] = @key"
      );
    console.log(`${key}의 값이 데이터베이스에서 업데이트되었습니다.`);
  } else {
    // 새로운 키 삽입
    await connection
      .request()
      .input("key", key)
      .input("value", encryptedValue)
      .query(
        "INSERT INTO [dbo].[NaverWorks] ([key], [value]) VALUES (@key, @value)"
      );
    console.log(`새로운 키 ${key}가 데이터베이스에 저장되었습니다.`);
  }

  await closeConnection();
}

async function getValFromDB(key, existingConnection = null) {
  let connection;
  let shouldClose = false;

  try {
    if (!existingConnection) {
      connection = await connectDB();
      shouldClose = true;
    } else {
      connection = existingConnection;
    }

    const result = await connection
      .request()
      .input("key", key)
      .query("SELECT [value] FROM [dbo].[NaverWorks] WHERE [key] = @key");

    if (result.recordset.length === 0) {
      console.log(`키 ${key}가 데이터베이스에 존재하지 않습니다.`);
      return null;
    }

    const decryptedValue = decrypt(result.recordset[0].value);
    return decryptedValue;
  } finally {
    if (shouldClose && connection) {
      await closeConnection();
    }
  }
}

module.exports = { setValIntoDB, getValFromDB };
