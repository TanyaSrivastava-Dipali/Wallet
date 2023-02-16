import express from "express";
// eslint-disable-next-line import/extensions
import * as UserController from "../controllers/userController.js";
import * as AuthController from "../controllers/authController.js";

const userRouter = express.Router();
userRouter.route("/register").post(AuthController.register);
userRouter.route("/login").post(AuthController.login);
userRouter.route("/getDetail").post(UserController.getDetail);
export default userRouter;
