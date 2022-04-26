import path from "path";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import fsr from "file-stream-rotator";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import YAML from "yamljs";
import swaggerUI from "swagger-ui-express";

const swaggerJSDocs = YAML.load("./api.yaml");

dotenv.config();

// const dot = require("dotenv").config();
connectDB();

const app = express();
const logloc = path.join("backend");
// if (process.env.NODE_ENV === "developement") {
// 	app.use(morgan("dev"));
// }

morgan.token("clientIPA", function (req, res) {
	return req.ip;
});

morgan.token("ts", function (req, res) {
	// req time stamp
	return new Date(Date.now());
});
// var accessLogStream = fsr.createStream('access.log', {
// 	interval: '1d', // rotate daily
// 	path: path.join(__dirname, 'log')
// })

const pstream = path.join(logloc, "logs", "product", "products.log");
let logsinfo = fsr.getStream({
	filename: pstream,
	frequency: "1h",
	verbose: true,
});
app.use(
	morgan(
		// 'wbdaccess'
		function (tokens, req, res) {
			return [
				tokens["clientIPA"](req, res),
				tokens["ts"](req, res),
				tokens.method(req, res),
				tokens.url(req, res),
				//   tokens.status(req, res),
				//   tokens.res(req, res, 'content-length'), '-',
				tokens["response-time"](req, res),
				"ms",
			].join(" ");
		},
		{ stream: logsinfo }
	)
);

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.get("/api/config/paypal", (req, res) =>
	res.send(process.env.PAYPAL_CLIENT_ID)
);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));

const __dirname = path.resolve();

console.log(path.join(__dirname, "/build"))
app.use(express.static(path.join(__dirname, "/build")));
app.get("*", (req, res) =>
	res.sendFile(path.resolve(__dirname, "build", "index.html"))
);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(
	PORT,
	console.log(
		`server runing in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
	)
);

export default app;