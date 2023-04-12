import Jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";

const isUserLoggedIn = catchAsync(async (req, res, next) => {
	// console.log("cookie",req.cookies);
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
