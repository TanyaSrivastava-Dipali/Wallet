import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

import validator from "validator";

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		min: [6, "Must be at least 6, got {VALUE}"],
		max: [255, "Must be at max 255, got {VALUE}"],
		required: [true, "name can not be null"],
	},
	walletAddress: {
		type: String,
		required: [true, "wallet address can not ne null"],
		validate: [validator.isEthereumAddress, "Not an Ethereum-compatible wallet address"],
	},
	encryptedPrivateKey: {
		type: String,
		required: [true, "private key can not ne null"],
	},
	email: {
		type: String,
		trim: true,
		unique: true,
		lowercase: true,
		required: [true, "email can not be null"],
		validate: [validator.isEmail, "Please provide a valid email"],
	},
	role: {
		type: String,
		enum: {
			values: ["admin", "user"],
			message: "{VALUE} is not supported",
		},
	},
	pass: {
		type: String,
		required: [true, "Password can not be null"],
		select: false,
	},
	confirmPass: {
		type: String,
		select: false,
	},
	isEmailVerified: {
		type: Boolean,
		default: false,
	},
	otpDetails: {
		otp: {
			type: String,
		},
		otpExpiration: {
			type: Number,
		},
	},
	passResetToken: String,
	passResetExpires: Date,
	passChangedAt: Date,
	created: {
		type: Date,
		default: Date.now,
	},
});

userSchema.pre("save", async function (next) {
	if (this.isModified("pass")) {
		this.pass = await bcrypt.hash(this.pass, 10);
		this.confirmPass = undefined;
	}
	next();
});

userSchema.methods.validatePassword = async function (pass, userpass) {
	return await bcrypt.compare(pass, userpass);
};

userSchema.methods.createPasswordResetToken = function () {
	const passResetToken = crypto.randomBytes(32).toString("hex");
	this.passResetToken = crypto.createHash("sha256").update(passResetToken).digest("hex");
	this.passResetExpires = Date.now() + 10 * 60 * 1000;
	return passResetToken;
};

const UserModel = mongoose.model("UserModel", userSchema);
export default UserModel;
