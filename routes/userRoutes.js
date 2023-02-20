import express from "express";
// eslint-disable-next-line import/extensions
import * as UserController from "../controllers/userController.js";
// eslint-disable-next-line import/extensions
import * as AuthController from "../controllers/authController.js";
// eslint-disable-next-line import/extensions
import verify from "../middleware/verify.js";
// eslint-disable-next-line import/extensions
import isUserLoggedIn from "../middleware/userLoginStatus.js";

const userRouter = express.Router();
userRouter.route("/register").post(AuthController.register);
userRouter.route("/login").post(verify, AuthController.login);
userRouter.route("/verifyEmail").post(AuthController.verifyEmail);
userRouter.route("/getOtpForEmailConfirmation").post(AuthController.getOtpForEmailConfirmation);
userRouter.route("/logout").get(isUserLoggedIn, AuthController.logout);
userRouter.route("/changepassword").post(isUserLoggedIn, AuthController.changePassword);
userRouter
	.route("/getResetPassOtpAndResetPassword")
	.post(AuthController.getResetPassOtpAndResetPassword);
userRouter.route("/deposit").post(isUserLoggedIn, UserController.deposit);
userRouter.route("/withdraw").post(isUserLoggedIn, UserController.withdraw);
userRouter.route("/getBalance").get(isUserLoggedIn, UserController.getBalance);
userRouter.route("/getUser").get(isUserLoggedIn, UserController.getUser);
export default userRouter;
