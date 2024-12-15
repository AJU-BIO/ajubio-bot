const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

// 암호화 키와 초기화 벡터 (환경 변수로 관리 권장)
const ENCRYPTION_KEY = process.env.SECRET_KEY;
const IV_LENGTH = 16; // AES block size (16 bytes)

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH); // 랜덤 IV 생성
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`; // IV와 암호화 데이터를 결합해 반환
}

function decrypt(encryptedText) {
  const [iv, encrypted] = encryptedText.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
