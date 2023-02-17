import Jwt from "jsonwebtoken";
// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
// eslint-disable-next-line import/extensions
import catchAsync from "../utils/catchAsync.js";

// eslint-disable-next-line consistent-return
const isUserLoggedIn = catchAsync(async (req, res, next) => {
	if (req.cookies.jwt) {
		const token = req.cookies.jwt;
		// console.log(token);
		const data = Jwt.verify(token, process.env.JWT_SECRET_KEY);
		const user = await UserModel.findOne({ _id: data.Id });
		if (!user) {
			return res.status(401).json({
				status: "Fail",
				message: "You are not logged in",
			});
		}
		req.user = user;
		return next();
	}
	res.status(401).json({
		status: "Fail",
		message: "You are not logged in",
	});
});

export default isUserLoggedIn;
