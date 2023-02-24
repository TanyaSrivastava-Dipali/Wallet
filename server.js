import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({ path: "./.env" });

const port = process.env.PORT || 5000;
mongoose
	.connect(process.env.DB_URL)
	.then(() => {
		console.log("Database successfully connected");
	})
	.catch((e) => {
		console.log(`Database connection error ${e}`);
	});

const server = app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

process.on("uncaughtException", (err) => {
	console.log("UNCAUGHT EXCEPTION! Server Shutting down...");
	console.log(err.name, err.message);
	process.exit(1);
});

process.on("unhandledRejection", (err) => {
	console.log("UNHANDLED REJECTION! server Shutting down...");
	console.log(err.name, err.message);
	server.close(() => {
		process.exit(1);
	});
});
