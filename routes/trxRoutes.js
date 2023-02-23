import express from "express";
import * as trxController from "../controllers/trxController.js";
import isUserLoggedIn from "../middleware/userLoginStatus.js";

const trxRouter = express.Router();

trxRouter.route("/transfer").post(isUserLoggedIn, trxController.transferFunds);

trxRouter
	.route("/getTransactionDetail/:trxHash")
	.get(isUserLoggedIn, trxController.getTransactionDetail);
trxRouter.route("/getAllTransactions").get(isUserLoggedIn, trxController.getAllTransactions);

export default trxRouter;
