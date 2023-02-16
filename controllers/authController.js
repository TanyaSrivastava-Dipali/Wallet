// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
// eslint-disable-next-line import/extensions
import EmailSender from "../utils/sendMail.js";
// eslint-disable-next-line import/extensions
import catchAsync from "../utils/catchAsync.js";

const register = catchAsync(async (req, res) => {
	const { pass, confirmPass } = req.body;
	if (pass !== confirmPass) {
		res.send("password not matched");
		return;
	}
	const user = await UserModel.create(req.body);

	const savedUser = await user.save();
	// const mail = new EmailSender(savedUser);
	// await mail.sendGreetingMessage();
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

export { register, login };
