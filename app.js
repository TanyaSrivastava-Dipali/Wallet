import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes.js";
import trxRouter from "./routes/trxRoutes.js";
import globalErrorHandler from "./controllers/globalErrorHandler.js";
import cors from 'cors';

const app = express();
app.use(cors());
app.options('*',cors());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/api/user/", userRouter);
app.use("/api/transaction/", trxRouter);
// global error handler
app.use(globalErrorHandler);
export default app;
