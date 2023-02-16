import express from "express";
// eslint-disable-next-line import/extensions
import * as UserController from "../controllers/userController.js";
// eslint-disable-next-line import/extensions
import * as AuthController from "../controllers/authController.js";
// eslint-disable-next-line import/extensions
import verify from "../middleware/verify.js";

const userRouter = express.Router();
userRouter.route("/register").post(AuthController.register);
userRouter.route("/login").post(verify, AuthController.login);
userRouter.route("/verifyEmail").post(AuthController.verifyEmail);
userRouter.route("/getOtpForEmailConfirmation").post(AuthController.getOtpForEmailConfirmation);
userRouter.route("/getDetail").post(UserController.getDetail);
export default userRouter;
