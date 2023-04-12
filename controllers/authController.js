import crypto from "crypto";
import { ethers } from "ethers";
import bip39 from "bip39";
import mongoose from "mongoose";
import UserModel from "../models/userModel.js";
import EmailSender from "../utils/sendMail.js";
import catchAsync from "../utils/catchAsync.js";
import generateOTP from "../utils/otpGenerator.js";
import jwtToken from "../utils/jwtToken.js";
import createTokenContractInstance from "../utils/createTokenInstance.js";
import { encrypt } from "../utils/encryptDecrypt.js";
import tokenArray from "../utils/tokenArray.js";

// register user
const register = catchAsync(async (req, res) => {
	if (req.body.pass !== req.body.confirmPass) {
		res.send("password not matched");
		return;
	}
	const { email } = req.body;
	const UserExist = await UserModel.findOne({ email });
	// checking if user is already registered
	if (UserExist) {
		return res.status(409).send("User Already Exist. Please Login");
	}

	// generate otp to send for email verification
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
	// checking whether user exist or not
	if (!User) {
		return res.status(400).send("User does not Exist. Please register");
	}
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
		name:User.name,
	});
});

const verifyEmail = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { email } = req.body;
		const user = await UserModel.findOne({ email }, null, { session });

		// checking whether user exist or not
		if (!user) {
			return res.status(400).send("User does not Exist. Please register");
		}
		// check whether user email is already verified or not
		if (!user.isEmailVerified) {
			const now = new Date();
			if (
				req.body.otp === user.otpDetails.otp &&
				now.getUTCSeconds() <= user.otpDetails.otpExpiration
			) {
				const provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_URL);
				const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
				await signer.sendTransaction({
					to: user.walletAddress,
					value: ethers.utils.parseEther("0.2"),
				});
				
				const sendReward = async (tokenContractAddress) => {
					// create token contract instance and get signer
					const [tokenContractInstance, signer] = createTokenContractInstance(
						process.env.ADMIN_PRIVATE_KEY,
						tokenContractAddress
					);
					const ethTrx = await tokenContractInstance
						.connect(signer)
						.mint(user.walletAddress, ethers.utils.parseUnits("1000", 18));
					if (!ethTrx) {
						throw new Error("Transaction Failed");
					}
				};
				// send token as joining reward
				for (let tokenContractAddress in tokenArray) {
					await sendReward(tokenArray[tokenContractAddress]);
				}
				user.isEmailVerified = true;
				user.otpDetails = undefined;
				// await user.save();
				await user.save({ session });
				await session.commitTransaction();

				// send mail to user with defined transport object
				// const mail = new EmailSender(user);
				// await mail.sendGreetingMessage();

				// set jwtToken in cookie
				jwtToken(user, 200, req, res);
				res.status(200).json({
					status: "Success",
					message: "Verification Successfull",
				});
			} else {
				res.status(400).json({
					status: "fail",
					message: "incorrect Detail",
				});
			}
		} else {
			res.status(302).send("Email already verified");
		}
	} catch (err) {
		console.log(err);
		await session.abortTransaction();
		res.status(400).json({
			status: "Fail",
			message: "Transaction failed",
			err,
		});
	} finally {
		session.endSession();
	}
};

const getOtpForEmailConfirmation = catchAsync(async (req, res) => {
	const email  = req.body.email;
	const user = await UserModel.findOne({ email });
	// checking whether user exist or not
	if (!user) {
		return res.status(400).send("User does not Exist. Please register");
	}
	// check whether user email is already verified or not
	if (!user.isEmailVerified) {
		const [verificationOtp, expTime] = generateOTP();
		user.otpDetails.otp = verificationOtp;
		user.otpDetails.otpExpiration = expTime;
		await user.save();
		// const mail = new EmailSender(user);
		// await mail.sendEmailVerification(verificationOtp);
		res.status(200).send("OTP sent successfully");
	} else {
		res.status(302).send({
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

const changePassword = catchAsync(async (req, res) => {
	const user = await UserModel.findById(req.user.id).select("+pass");
	// checking whether user exist or not
	if (!user) {
		return res.status(400).send("User does not Exist. Please register");
	}
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
		console.log(passResetToken);
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
				passResetToken: hashedToken,
				passResetExpires: { $gt: Date.now() },
			});
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
		return res.status(200).json({
			status: "Success",
			message: "Reset password successfully",
		});
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
