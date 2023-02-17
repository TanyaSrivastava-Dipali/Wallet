import mongoose from "mongoose";
// eslint-disable-next-line import/no-extraneous-dependencies
import validator from "validator";
// eslint-disable-next-line import/order
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		min: 6,
		max: 255,
		required: [true, "name can not be null"],
	},
	walletAddress: {
		type: String,
		required: [true, "wallet address can not ne null"],
		validate: [validator.isEthereumAddress, "Not an Ethereum-compatible wallet address"],
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
		enum: ["admin", "user"],
		default: "user",
	},
	pass: {
		type: String,
		required: [true, "Password can not be null"],
		min: 8,
		max: 255,
		select: false,
	},
	confirmPass: {
		type: String,
		min: 8,
		max: 255,
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
	// eslint-disable-next-line no-return-await
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
