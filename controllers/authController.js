// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
// eslint-disable-next-line import/extensions
import EmailSender from "../utils/sendMail.js";
// eslint-disable-next-line import/extensions
import catchAsync from "../utils/catchAsync.js";
// eslint-disable-next-line import/extensions
import generateOTP from "../utils/otpGenerator.js";

const register = catchAsync(async (req, res) => {
	if (req.body.pass !== req.body.confirmPass) {
		res.send("password not matched");
		return;
	}
	const { email } = req.body.email;
	const UserExist = await UserModel.findOne({ email });

	if (UserExist) {
		// eslint-disable-next-line consistent-return
		return res.status(409).send("User Already Exist. Please Login");
	}

	const [verificationOtp, expTime] = generateOTP();

	const user = await UserModel.create({
		name: req.body.name,
		email: req.body.email,
		walletAddress: req.body.walletAddress,
		pass: req.body.pass,
		confirmPass: req.body.confirmPass,
		otpDetails: {
			otp: verificationOtp,
			otpExpiration: expTime,
		},
	});

	const savedUser = await user.save();
	// const mail = new EmailSender(savedUser);
	// await mail.sendEmailVerification(verificationOtp);
	res.status(201).json({
		status: "success",
		savedUser,
	});
});

// eslint-disable-next-line consistent-return
const login = catchAsync(async (req, res) => {
	const { email, pass } = req.body;
	if (!email || !pass) {
		return res.status(400).json({
			status: "fail",
			message: "Email or Password not found",
		});
	}
	// const User = await UserModel.findOne({ email });
	const User = await UserModel.findOne({ email }).select("+pass");
	const isMatched = await User.validatePassword(pass, User.pass);
	if (!User || !isMatched) {
		return res.status(400).json({
			status: "Fail",
			message: "Invalid login credentials",
		});
	}
	res.status(400).json({
		status: "Success",
		User,
	});
});

const verifyEmail = catchAsync(async (req, res) => {
	// eslint-disable-next-line prefer-destructuring
	const email = req.body.email;
	const user = await UserModel.findOne({ email });
	if (!user.isEmailVerified) {
		const now = new Date();
		if (
			req.body.otp === user.otpDetails.otp &&
			now.getUTCSeconds() <= user.otpDetails.otpExpiration
		) {
			user.isEmailVerified = true;
			user.otpDetails = undefined;
			await user.save();
			// const mail = new EmailSender(user);
			// await mail.sendGreetingMessage();
			res.status(201).send("Email Verified Successfully");
		} else {
			res.send("Something went wrong");
		}
	} else {
		res.send("Email already verified");
	}
});

const getOtpForEmailConfirmation = catchAsync(async (req, res) => {
	// eslint-disable-next-line prefer-destructuring
	const email = req.body.email;
	const user = await UserModel.findOne({ email });
	if (!user.isEmailVerified) {
		const [verificationOtp, expTime] = generateOTP;
		user.otpDetails.otp = verificationOtp;
		user.otpDetails.otpExpiration = expTime;
		await user.save();
		// const mail = new EmailSender(user);
		// await mail.sendEmailVerification(verificationOtp);
		res.send("OTP sent successfully");
	} else {
		res.send({
			message: "Email Already Verified.",
		});
	}
});

export { register, login, verifyEmail, getOtpForEmailConfirmation };
