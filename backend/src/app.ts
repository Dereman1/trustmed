import express, {Request, Response} from "express";
import morgan from "morgan";
import apiRouter from "./routes/index.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { sendSuccess } from "./core/http/response.js";
import { corsMiddleware } from "./middlewares/cors.js";

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req:Request, res:Response) => {
  return sendSuccess(res, 200, { name: "mvp-template-backend" }, "API online");
});

app.use("/", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
