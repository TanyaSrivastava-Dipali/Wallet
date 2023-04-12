import  ethers  from "ethers";
import mongoose from "mongoose";
import UserModel from "../models/userModel.js";
import depositWithdrawModel from "../models/depositWithdrawModel.js";
import createTokenContractInstance from "../utils/createTokenInstance.js";
import tokenArray from "../utils/tokenArray.js";
import EmailSender from "../utils/sendMail.js";
import { decrypt } from "../utils/encryptDecrypt.js";

const getUser = async (req, res) => {
	try {
		const user = await UserModel.findOne({ email: req.params.email });
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
		const email  = req.params.email;
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(404).json({
				status: "Fail",
				message: "User does not exist",
			});
		}
		const balance= new Map();;
		const checkBalance = async (tokenContractAddress) => {
			// create token contract instance and get signer
			const [tokenContractInstance, signer] = createTokenContractInstance(
				process.env.ADMIN_PRIVATE_KEY,
				tokenContractAddress
			);
			// check balance
		let name= await tokenContractInstance.name();
		let bal = await tokenContractInstance.balanceOf(user.walletAddress);
		balance.set(name, ethers.utils.formatUnits(bal, 18));
		};
		// send token as joining reward
		for (let tokenContractAddress in tokenArray) {
			await checkBalance(tokenArray[tokenContractAddress]);
		}
		const bal=[...balance]
		res.status(200).json({
			status: "Success",
			bal
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			status: "Fail",
			err,
		});
	}
};
const deposit = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const User = await UserModel.findOne({ email: req.user.email }, null, { session });
		// check whether user with given email exist or not
		if (!User) {
			return res.status(404).json({
				status: "Fail",
				message: " user doesn't exist",
			});
		}
		// create token contract instance
		const [tokenContractInstance, signer] = createTokenContractInstance(
			process.env.ADMIN_PRIVATE_KEY,req.body.tokenAddress
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
		// create new transaction
		const trx = await depositWithdrawModel.create(
			[
				{
					AddressTo: User.email,
					userWalletAddress: User.walletAddress,
					amount: Amt,
					action: "deposit",
					ethTRXHash: "Null",
				},
			],
			{ session }
		);
		//getTokenName
		const name=	await tokenContractInstance.name();
		// mint
		const ethTrx = await tokenContractInstance.connect(signer).mint(User.walletAddress, Amt);
		if (!ethTrx) {
			throw new Error("Transaction Failed");
		}
		await depositWithdrawModel.findOneAndUpdate(
			{ _id: trx[0]._id },
			{ "$set": { ethTRXHash: ethTrx.hash ,token : name}},
			{ session }
		);
		await session.commitTransaction();
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
		await session.abortTransaction();
		res.status(400).json({
			status: "Fail",
			message: "Transaction failed",
			err,
		});
	} finally {
		session.endSession();
	}
};

const withdraw = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const User = await UserModel.findOne({ email: req.user.email }, null, { session });
			// check whether user with given email exist or not
			if (!User) {
				return res.status(404).json({
					status: "Fail",
					message: " user doesn't exist",
				});
			}	
		// create token contract instance and retrieve signer by decrypting serder encrypted private key
			const [tokenContractInstance, signer] = createTokenContractInstance(
				decrypt( User.encryptedPrivateKey ),req.body.tokenAddress
			);
		const to = await UserModel.findOne({ email: req.body.toEmail }, null, { session });
	  if (!to) {
		return res.status(404).json({
			status: "Fail",
			message: "to address doesn't exist",
		});
	}
		const { amount } = req.body;
		const Amt = ethers.utils.parseUnits(amount, 18);

		// check whether amount is grater than 0 and less than his balance or not
		if (Amt.lt(0) && Amt.gt(await tokenContractInstance.balanceOf(User.walletAddress))) {
			return res.status(401).json({
				status: "Fail",
				message: "amount should be greater than 0 and less than user balance",
			});
		}
		// create new transaction
		const trx = await depositWithdrawModel.create(
			[
				{
					AddressFrom: User.email,
					userWalletAddress: User.walletAddress,
					amount: Amt,
					action: "withdraw",
					ethTRXHash: "Null",
				},
			],
			{ session }
		);
	//getTokenName
	const name=	await tokenContractInstance.name();
	//transfer
	const ethTrx = await tokenContractInstance
		.connect(signer)
		.transfer(to.walletAddress, Amt);
	if (!ethTrx) {
		throw new Error("Transaction Failed");
	}
	await depositWithdrawModel.findOneAndUpdate(
		{ _id: trx[0]._id },
		{ "$set": { ethTRXHash: ethTrx.hash ,token : name}},
		{ session });
		await session.commitTransaction();
		
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
		await session.abortTransaction();
		res.status(400).json({
			status: "Fail",
			message: "Transaction failed",
			err,
		});
	} finally {
		session.endSession();
	}
};

export { getUser, getBalance, deposit, withdraw };
