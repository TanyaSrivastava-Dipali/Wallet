import otpGenerator from "otp-generator";

const generateOTP = () => {
	const otp = otpGenerator.generate(8, {
		alphabets: false,
		upperCase: false,
		specialChars: false,
	});

	const now = new Date();
	const otpexpiration = now.getUTCSeconds() + 600;
	return [otp, otpexpiration];
};

export default generateOTP;
