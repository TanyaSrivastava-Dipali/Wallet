// eslint-disable-next-line import/extensions
import UserModel from "../models/userModel.js";

const getDetail = async (req, res) => {
	console.log("signup");
	res.send("signup");
};
const login = async (req, res) => {
	console.log("login");
	res.send("login");
};

export { getDetail, login };
