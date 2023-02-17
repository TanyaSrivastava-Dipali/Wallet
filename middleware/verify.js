// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
// eslint-disable-next-line import/extensions
import catchAsync from "../utils/catchAsync.js";

// eslint-disable-next-line consistent-return
const verify = catchAsync(async (req, res, next) => {
	// eslint-disable-next-line prefer-destructuring
	const email = req.body.email;
	const user = await UserModel.findOne({ email });
	if (!user) {
		return res.status(401).json({
			status: "Fail",
			message: "User not registered",
		});
	}
	if (!user.isEmailVerified) {
		return res.status(401).json({
			status: "Login Failed",
			message: "First verify your email",
		});
	}
	req.user = user;
	next();
});

export default verify;
