// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
// eslint-disable-next-line import/extensions
import EmailSender from "../utils/sendMail.js";
// eslint-disable-next-line import/extensions
import catchAsync from "../utils/catchAsync.js";
// eslint-disable-next-line import/extensions
import generateOTP from "../utils/otpGenerator.js";
// eslint-disable-next-line import/extensions
import jwtToken from "../utils/JWT_Token.js";
// eslint-disable-next-line import/extensions
import createTokenContractInstance from "../utils/createTokenInstance.js";
// eslint-disable-next-line import/extensions
import { encrypt } from "../utils/encryptDecrypt.js";
// eslint-disable-next-line import/order
import crypto from "crypto";
// eslint-disable-next-line import/no-extraneous-dependencies, import/order
import { ethers } from "ethers";
// eslint-disable-next-line import/no-extraneous-dependencies, import/order
import bip39 from "bip39";

// register user
const register = catchAsync(async (req, res) => {
	if (req.body.pass !== req.body.confirmPass) {
		res.send("password not matched");
		return;
	}
	// eslint-disable-next-line prefer-destructuring
	const email = req.body.email;
	const UserExist = await UserModel.findOne({ email });
	// checking if user is already registered
	if (UserExist) {
		// eslint-disable-next-line consistent-return
		return res.status(409).send("User Already Exist. Please Login");
	}

	// generatee otp to send for email verification
	const [verificationOtp, expTime] = generateOTP();

	// generate mnemonic for wallet creation
	const mnemonic = bip39.generateMnemonic();
	const wallet = ethers.Wallet.fromMnemonic(mnemonic);
	// encrypt private key before storing in database
	const encryptedPrivateKey = encrypt(wallet.privateKey);
	// create a new user
	const user = await UserModel.create({
		name: req.body.name,
		email: email.toLowerCase(),
		walletAddress: wallet.address,
		encryptedPrivateKey,
		pass: req.body.pass,
		confirmPass: req.body.confirmPass,
		otpDetails: {
			otp: verificationOtp,
			otpExpiration: expTime,
		},
		role: req.body.role || "user",
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
	// check whether entered password matches with stored password or not
	const isMatched = await User.validatePassword(pass, User.pass);
	if (!User || !isMatched) {
		return res.status(400).json({
			status: "Fail",
			message: "Invalid login credentials",
		});
	}
	// set jwtToken in cookie
	jwtToken(User, 200, req, res);
	res.status(200).json({
		status: "Success",
		message: "login Successfully",
	});
});

// eslint-disable-next-line consistent-return
const verifyEmail = async (req, res) => {
	// const session = await mongoose.startSession();
	// session.startTransaction();
	// eslint-disable-next-line prefer-destructuring
	const email = req.body.email;
	// const user = await UserModel.findOne({ email }, { session });
	const user = await UserModel.findOne({ email });
	// check whether user email is already verified or not
	if (!user.isEmailVerified) {
		try {
			const now = new Date();
			if (
				req.body.otp === user.otpDetails.otp &&
				now.getUTCSeconds() <= user.otpDetails.otpExpiration
			) {
				// create token contract instance and get signer
				const [tokenContractInstance, signer] = createTokenContractInstance(
					process.env.ADMIN_PRIVATE_KEY
				);
				await signer.sendTransaction({
					to: user.walletAddress,
					value: ethers.utils.parseEther("1.0"),
				});
				// send token as joining reward
				const ethTrx = await tokenContractInstance
					.connect(signer)
					.mint(user.walletAddress, ethers.utils.parseUnits("1000", 18));
				if (!ethTrx) {
					throw new Error("Transaction Failed");
				}
				user.isEmailVerified = true;
				user.otpDetails = undefined;
				await user.save();
				// await user.save({ session });
				// await session.commitTransaction();

				// // send mail to user with defined transport object
				// const mail = new EmailSender(user);
				// await mail.sendGreetingMessage();

				// set jwtToken in cookie
				jwtToken(user, 200, req, res);
				res.status(200).json({
					status: "Success",
					message: "Verification Successfull",
					ethTransactionHash: ethTrx.hash,
				});
			}
		} catch (err) {
			console.log(err);
			// await session.abortTransaction();
			res.status(400).json({
				status: "Fail",
				message: "Transaction failed",
				err,
			});
		}
		// } finally {
		// 	session.endSession();
		// }
	} else {
		res.send("Email already verified");
	}
};

const getOtpForEmailConfirmation = catchAsync(async (req, res) => {
	// eslint-disable-next-line prefer-destructuring
	const email = req.body.email;
	const user = await UserModel.findOne({ email });
	// check whether user email is already verified or not
	if (!user.isEmailVerified) {
		const [verificationOtp, expTime] = generateOTP();
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

const logout = catchAsync(async (req, res) => {
	// clear cookie
	res.cookie("jwt", "", {
		expires: new Date(Date.now() + 1 * 1000),
		httpOnly: true,
	});
	res.status(200).json({ status: "logout successfully" });
});

// eslint-disable-next-line consistent-return
const changePassword = catchAsync(async (req, res) => {
	const user = await UserModel.findById(req.user.id).select("+pass");
	// check whether current password is correct or not
	if (!(await user.validatePassword(req.body.currentPass, user.pass))) {
		return res.status(401).json({
			status: "Fail",
			message: "Current password is incorrect",
		});
	}
	user.pass = req.body.newPass;
	user.confirmPass = req.body.confirmNewPass;
	await user.save();
	// clear cookie
	res.cookie("jwt", "", {
		expires: new Date(Date.now() + 1 * 1000),
		httpOnly: true,
	});
	res.status(200).json({
		status: "Success",
		message: "password changed successfully.Please login to use its services",
	});
});

// eslint-disable-next-line consistent-return
const getResetPassOtpAndResetPassword = catchAsync(async (req, res) => {
	if (!req.body.target) {
		return res.status(404).json({
			status: "Fail",
			message: "target is required",
		});
	}
	if (req.body.target === "getResetPassOtp") {
		const user = await UserModel.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({
				status: "Fail",
				message: "No user found with this email",
			});
		}
		const passResetToken = user.createPasswordResetToken();
		await user.save({ validateBeforeSave: false });
		// const mail = new EmailSender(user);
		// await mail.sendPasswordResetToken(passResetToken);
		res.status(200).json({
			status: "success",
			message: "Reset password Token sent to email.kindly reset you password!",
		});
	}
	if (req.body.target === "resetPassword") {
		const hashedToken = crypto
			.createHash("sha256")
			.update(req.body.passResetToken)
			.digest("hex");
		const user = await UserModel.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpires: { $gt: Date.now() },
		});
		console.log(user);
		if (!user) {
			return res.status(404).json({
				status: "Fail",
				message: "User does not exist or Reset time expired",
			});
		}
		user.pass = req.body.pass;
		user.confirmPass = req.body.confirmPass;
		user.passResetToken = undefined;
		user.passResetExpires = undefined;
		await user.save();
		jwtToken(user, 200, req, res);
	}
});

export {
	register,
	login,
	verifyEmail,
	getOtpForEmailConfirmation,
	logout,
	changePassword,
	getResetPassOtpAndResetPassword,
};
