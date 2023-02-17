import express from "express";
import cookieParser from "cookie-parser";

// eslint-disable-next-line import/extensions
import userRouter from "./routes/userRoutes.js";
// eslint-disable-next-line import/extensions
import globalErrorHandler from "./controllers/globalErrorHandler.js";

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/api/user/", userRouter);
// global error handler
app.use(globalErrorHandler);
export default app;
