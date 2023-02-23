import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const algorithm = process.env.ALGORITHM;
const password = process.env.PASSWORD;
const salt = process.env.SALT;
const iv = process.env.IV;
const inputEncoding = process.env.INPUT_ENCODING;
const outputEncoding = process.env.OUTPUT_ENCODING;

const createHashPassword = () => {
	const nodeCrypto = crypto.pbkdf2Sync(
		Buffer.from(password),
		Buffer.from(salt),
		65536,
		16,
		"sha1"
	);

	return nodeCrypto || nodeCrypto.toString("hex");
};
const encrypt = (text) => {
	const cipher = crypto.createCipheriv(algorithm, createHashPassword(), iv);
	let encrypted = cipher.update(text, inputEncoding, outputEncoding);
	encrypted += cipher.final(outputEncoding);
	return encrypted;
};

const decrypt = (encrypted) => {
	const decipher = crypto.createDecipheriv(
		algorithm,
		Buffer.from(createHashPassword(), "hex"),
		iv
	);
	let dec = decipher.update(encrypted, outputEncoding, inputEncoding);
	dec += decipher.final(inputEncoding);
	return dec;
};
export { encrypt, decrypt };
