import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const globalErrorHandler = async (err, req, res) => {
	console.log(process.env.NODE_ENV);
	console.log(err);
	let statusCode = 400;
	let errMessage = "Something Went Wrong";
	if (err.name === "MongooseServerSelectionError") {
		statusCode = 500;
	}

	if (err.name === "ValidationError") {
		errMessage = err.message;
	}

	if (err.code === 11000) {
		errMessage = `Duplicate Key error ${Object.keys(err.keyValue)[0]}`;
	}
	if (err.name === "Invalid login") {
		errMessage = `Invalid login error: ${Object.keys(err.keyValue)[0]}`;
	}
	if (process.env.NODE_ENV === "development") {
		return res.status(statusCode).json({
			status: "Error",
			message: err,
		});
	}
	res.status(statusCode).json({
		status: "Error",
		message: errMessage,
	});
};

export default globalErrorHandler;
