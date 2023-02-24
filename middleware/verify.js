import UserModel from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";

const verify = catchAsync(async (req, res, next) => {
	const {email} = req.body;
	const user = await UserModel.findOne({ email });
	if (!user) {
		return res.status(404).json({
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
