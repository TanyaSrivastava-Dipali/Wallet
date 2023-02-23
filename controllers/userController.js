// eslint-disable-next-line import/no-extraneous-dependencies
import { ethers } from "ethers";
import UserModel from "../models/userModel.js";
import depositWithdrawModel from "../models/depositWithdrawModel.js";
import createTokenContractInstance from "../utils/createTokenInstance.js";

// eslint-disable-next-line consistent-return
const getUser = async (req, res) => {
	try {
		const user = await UserModel.findOne({ email: req.body.email });
		// check whether user with given email exist or not
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
		// create token contract instance
		const [tokenContractInstance] = createTokenContractInstance(process.env.ADMIN_PRIVATE_KEY);
		const { email } = req.body;
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(404).json({
				status: "Fail",
				message: "User does not exist",
			});
		}
		// check balance
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

// eslint-disable-next-line consistent-return
const deposit = async (req, res) => {
	try {
		const User = await UserModel.findOne({ email: req.user.email });
		// check whether user with given email exist or not
		if (!User) {
			return res.status(404).json({
				status: "Fail",
				message: " user doesn't exist",
			});
		}

		// create token contract instance
		const [tokenContractInstance, signer] = createTokenContractInstance(
			process.env.ADMIN_PRIVATE_KEY
		);
		const { amount } = req.body;
		const Amt = ethers.utils.parseUnits(amount, 18);
		// check whether amount is grater than 0 or not
		if (Amt.lt(0)) {
			return res.status(401).json({
				status: "Fail",
				message: "amount should be grater than 0",
			});
		}
		// mint
		const ethTrx = await tokenContractInstance.connect(signer).mint(User.walletAddress, Amt);
		if (!ethTrx) {
			throw new Error("Transaction Failed");
		}
		// create new transaction
		const trx = await depositWithdrawModel.create({
			AddressTo: User.email,
			userWalletAddress: User.walletAddress,
			amount: Amt,
			action: "deposit",
			ethTRXHash: ethTrx.hash,
		});
		await trx.save();
		// const mail = new EmailSender(User);
		// await mail.sendDepositConfirmation(
		// 	trx[0],
		// 	User.walletAddress
		// );
		res.status(200).json({
			status: "Success",
			message: "deposit was successful",
			// transactionId: trx[0].id,
			ethTransactionHash: ethTrx.hash,
		});
	} catch (err) {
		res.status(400).json({
			status: "Fail",
			message: "Transaction failed",
			err,
		});
	}
};

// eslint-disable-next-line consistent-return
const withdraw = async (req, res) => {
	try {
		const User = await UserModel.findOne({ email: req.user.email });
		// check whether user with given email exist or not
		if (!User) {
			return res.status(404).json({
				status: "Fail",
				message: " user doesn't exist",
			});
		}
		// create token contract instance
		const [tokenContractInstance, signer] = createTokenContractInstance(
			process.env.ADMIN_PRIVATE_KEY
		);
		const { amount } = req.body;
		const Amt = ethers.utils.parseUnits(amount, 18);

		// check whether amount is grater than 0 and less than his balance or not
		if (Amt.lt(0) && Amt.gt(await tokenContractInstance.balanceOf(User.walletAddress))) {
			return res.status(401).json({
				status: "Fail",
				message: "amount should be grater than 0 and less than user balance",
			});
		}
		// burn
		const ethTrx = await tokenContractInstance.connect(signer).burn(User.walletAddress, Amt);
		if (!ethTrx) {
			throw new Error("Transaction Failed");
		}
		// create new transaction
		const trx = await depositWithdrawModel.create({
			AddressFrom: User.email,
			userWalletAddress: User.walletAddress,
			amount: Amt,
			action: "withdraw",
			ethTRXHash: ethTrx.hash,
		});
		await trx.save();
		// const mail = new EmailSender(User);
		// await mail.sendWithdrawConfirmation(
		// 	trx[0],
		// 	User.walletAddress
		// );
		res.status(200).json({
			status: "Success",
			message: "withdraw was successful",
			// transactionId: trx[0].id,
			ethTransactionHash: ethTrx.hash,
		});
	} catch (err) {
		res.status(400).json({
			status: "Fail",
			message: "Transaction failed",
			err,
		});
	}
};

export { getUser, getBalance, deposit, withdraw };
