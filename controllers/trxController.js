import ethers from "ethers";
import mongoose from "mongoose";
import UserModel from "../models/userModel.js";
import trxModel from "../models/trxModel.js";
import catchAsync from "../utils/catchAsync.js";
import { decrypt } from "../utils/encryptDecrypt.js";
import EmailSender from "../utils/sendMail.js";
import createTokenContractInstance from "../utils/createTokenInstance.js";

const transferFunds = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const senderUser = await UserModel.findOne({ email: req.user.email }, null, { session });
		// create token contract instance and retrieve signer by decrypting serder encrypted private key
		const [tokenContractInstance, signer] = createTokenContractInstance(
			decrypt(senderUser.encryptedPrivateKey),
			req.body.tokenAddress
		);

		const { recepientEmail, amountToTransfer } = req.body;
		// format amount
		const transaferAmount = ethers.utils.parseUnits(amountToTransfer, 18);
		// chech whether Recepient user  exist or not
		const recepientUser = await UserModel.findOne({ email: recepientEmail }, null, { session });
		if (!recepientUser) {
			return res.status(404).json({
				status: "Fail",
				message: "Recepient address doesn't exist",
			});
		}
		if (recepientUser.email === senderUser.email) {
			return res.status(404).json({
				status: "Fail",
				message: "sender and receiver address can not be same",
			});
		}
		// check whether user has sufficient balance to transfer or not
		if (transaferAmount.gt(await tokenContractInstance.balanceOf(signer.address))) {
			return res.status(401).json({
				status: "Fail",
				message: "Sender doesn't have sufficient balance to transfer",
			});
		}
		const trx = await trxModel.create(
			[
				{
					sender: senderUser.email,
					receiver: recepientUser.email,
					SenderWalletAddress: senderUser.walletAddress,
					ReceiverWalletAddress: recepientUser.walletAddress,
					amount: amountToTransfer,
					ethTRXHash: "Null",
				},
			],
			{ session }
		);
		//getTokenName
		const name = await tokenContractInstance.name();
		const ethTrx = await tokenContractInstance
			.connect(signer)
			.transfer(recepientUser.walletAddress, transaferAmount);
		if (!ethTrx) {
			throw new Error("Transaction Failed");
		}
		await trxModel.findOneAndUpdate(
			{ _id: trx[0]._id },
			{ $set: { ethTRXHash: ethTrx.hash, token: name } },
			{ session }
		);
		await session.commitTransaction();
		// const mailToSender = new EmailSender(senderUser);
		// await mailToSender.sendTransactionConfirmation(
		// 	senderUser.email,recepientUser.email,trx.amount,trx.ethTRXHash,
		// 	senderUser.walletAddress,
		// 	recepientUser.walletAddress
		// );
		// const mailToReceiver = new EmailSender(recepientUser);
		// await mailToReceiver.sendTransactionConfirmation(
		// 	senderUser.email,recepientUser.email,trx.amount,trx.ethTRXHash,
		// 	senderUser.walletAddress,
		// 	recepientUser.walletAddress
		// );
		res.status(200).json({
			status: "Success",
			message: "Transfer was successful",
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

const getAllTransactions = catchAsync(async (req, res) => {
	// if requested user role is admin then send all transactions
	if (req.user.role === "admin") {
		const allTrx = await trxModel.find({});
		return res.status(200).json({
			status: "Success",
			message: "List of all the transactions",
			transactionCount: allTrx.length,
			allTrx,
		});
	}
	// if requested user role is  user then send only those transactions that's associated with requester user email
	if (req.user.role === "user") {
		const allTrx = await trxModel.find({
			$or: [{ sender: req.user.email }, { receiver: req.user.email }],
		});
		return res.status(200).json({
			status: "Success",
			message: "List of all the transactions associated with user email",
			transactionCount: allTrx.length,
			allTrx,
		});
	}
	return res.status(404).json({
		status: "Fail",
		message: "No transactions found",
	});
});

const getTransactionDetail = catchAsync(async (req, res) => {
	const ethTRXHash = req.params.trxHash;
	const trx = await trxModel.findOne({ ethTRXHash });
	// chech whether transaction for given transaction hash  exist or not
	if (!trx) {
		return res.status(404).json({
			status: "Fail",
			message: "Transaction not found",
		});
	}
	// chech whether transaction for given transaction hash  associated to requested user  or not
	// if (!trx.sender === req.user.email && !trx.receiver === req.user.email) {
	// 	return res.status(403).json({
	// 		status: "Fail",
	// 		message: "Access Denied.. You cannot access someone else's transaction details",
	// 	});
	// }
	res.status(200).json({
		status: "Success",
		transaction: trx,
	});
});


export { getTransactionDetail, getAllTransactions, transferFunds };
