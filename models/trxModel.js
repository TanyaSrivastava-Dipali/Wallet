import mongoose from "mongoose";
import validator from "validator";

const transactionSchema = new mongoose.Schema({
	sender: {
		type: String,
		trim: true,
		lowercase: true,
		required: [true, "email can not be null"],
		validate: [validator.isEmail, "Please provide a valid email"],
	},
	receiver: {
		type: String,
		trim: true,
		lowercase: true,
		required: [true, "email can not be null"],
		validate: [validator.isEmail, "Please provide a valid email"],
	},
	SenderWalletAddress: {
		type: String,
		required: [true, "wallet address can not ne null"],
		validate: [validator.isEthereumAddress, "Not an Ethereum-compatible wallet address"],
	},
	ReceiverWalletAddress: {
		type: String,
		required: [true, "wallet address can not ne null"],
		validate: [validator.isEthereumAddress, "Not an Ethereum-compatible wallet address"],
	},
	amount: {
		type: Number,
		require: [true, "Amount must be specified"],
	},
	token:{
		type: String,
		require: [true, "token name must be specified"],
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
const trxModel = mongoose.model("trxModel", transactionSchema);

export default trxModel;
