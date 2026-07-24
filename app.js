import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import { rateLimit, MINUTE } from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import healthRoutes from "./routes/health.route.js";
import userRoutes from "./routes/user.route.js";

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

//Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * MINUTE, // SECOND, MINUTE, HOUR, and DAY constants are available, or a use bare number for milliseconds
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(helmet());
app.use(hpp());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin",
      "device-remember-token",
    ],
  }),
);
app.use("/api", limiter);

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
//404 Handler

//API Routes
app.use("/health", healthRoutes);
app.use("/api/v1/users", userRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
  });
});

//Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
});

export default app;
