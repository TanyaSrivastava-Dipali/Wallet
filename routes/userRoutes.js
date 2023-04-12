import express from "express";
import * as UserController from "../controllers/userController.js";
import * as AuthController from "../controllers/authController.js";
import verify from "../middleware/verify.js";
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
userRouter.route("/getBalance/:email").get(isUserLoggedIn, UserController.getBalance);
userRouter.route("/getUser/:email").get(isUserLoggedIn,  UserController.getUser);
export default userRouter;
