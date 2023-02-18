/* eslint-disable import/extensions */
// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";
import trxModel from "../models/trxModel.js";
import catchAsync from "../utils/catchAsync.js";

// eslint-disable-next-line consistent-return
const getTransactionDetail = catchAsync(async (req, res) => {
	const ethTRXHash = req.params.trxHash;
	const trx = await trxModel.findOne({ ethTRXHash });
	if (!trx) {
		return res.status(404).json({
			status: "Fail",
			message: "Transaction is not found",
		});
	}
	res.status(200).json({
		status: "Success",
		transaction: trx,
	});
});

const getAllTransactions = catchAsync(async (req, res) => {
	if (req.user.role === "admin") {
		const allTrx = await trxModel.find({});
		return res.status(200).json({
			status: "Success",
			message: "List of all the transactions",
			transactionCount: allTrx.length,
			allTrx,
		});
	}
	if (req.user.role === "user") {
		const allTrx = await trxModel.find({
			$or: [{ sender: req.user.email }, { receiver: req.user.email }],
		});
		return res.status(200).json({
			status: "Success",
			message: "List of all the transactions pertaining to user",
			transactionCount: allTrx.length,
			allTrx,
		});
	}
	return res.status(404).json({
		status: "Fail",
		message: "No transactions found",
	});
});

export { getTransactionDetail, getAllTransactions };
