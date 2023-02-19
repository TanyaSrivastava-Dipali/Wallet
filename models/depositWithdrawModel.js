import mongoose from "mongoose";
import validator from "validator";

const depositWithdrawSchema = new mongoose.Schema({
	AddressTo: {
		type: String,
		trim: true,
		lowercase: true,
	},
	AddressFrom: {
		type: String,
		trim: true,
		lowercase: true,
	},
	userWalletAddress: {
		type: String,
		required: [true, "wallet address can not ne null"],
		validate: [validator.isEthereumAddress, "Not an Ethereum-compatible wallet address"],
	},
	amount: {
		type: Number,
		require: [true, "Amount must be specified"],
	},
	role: {
		type: String,
		enum: {
			values: ["deposit", "withdraw"],
			message: "{VALUE} is not supported",
		},
	},
	trxTimeStamp: {
		type: Date,
		default: Date.now(),
	},
	ethTRXHash: {
		type: String,
		require: [true, "Ethereum transaction hash is required"],
	},
});
const depositWithdrawModel = mongoose.model("depositWithdrawModel", depositWithdrawSchema);

export default depositWithdrawModel;
