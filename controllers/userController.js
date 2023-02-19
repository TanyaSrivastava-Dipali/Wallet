// eslint-disable-next-line import/no-extraneous-dependencies
import { ethers } from "ethers";
// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
// eslint-disable-next-line import/extensions
import createTokenContractInstance from "../utils/createTokenInstance.js";

// eslint-disable-next-line consistent-return
const getUser = async (req, res) => {
	try {
		const user = await UserModel.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({
				status: "Fail",
				message: "User does not exist",
			});
		}
		res.status(200).json({
			status: "Success",
			user,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			status: "Fail",
			err,
		});
	}
};
const getBalance = async (req, res) => {
	try {
		const [tokenContractInstance] = createTokenContractInstance(process.env.ADMIN_PRIVATE_KEY);
		const { email } = req.body;
		const user = await UserModel.findOne({ email });
		let balance = await tokenContractInstance.balanceOf(user.walletAddress);
		balance = ethers.utils.formatUnits(balance, 18);
		res.status(200).json({
			status: "Success",
			balance,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			status: "Fail",
			err,
		});
	}
};
export { getUser, getBalance };
