import jwt from "jsonwebtoken";

const jwtToken = (user, statusCode, req, res) => {
	const token = jwt.sign({ Id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
	res.cookie("jwt", token, {
		expires: new Date(Date.now() + 30 * 60 * 1000),
		httpOnly: true,
		// secure: req.secure || req.headers["x-forwarded-proto"] === "https",
	});
	user.password = undefined;
};

export default jwtToken;
