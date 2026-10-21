import "dotenv/config";
import cors from "cors";
import {env} from "./config/session"
import session from "express-session";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import eventRoute  from "./routes/eventform.route"
import newsBlogRoute from "./routes/newsBlogForm.route"
import timeAward from "./routes/timeAward.route"
import pool, { checkDatabaseConnection } from "./db/pool";
import express, { type Request, type Response } from "express";


const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,
}));

app.use(express.json());

app.use(cookieParser());

app.use(
  session({
    secret: env.secret.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.nodeENV === "production",
      sameSite: "lax",
      maxAge: Number(env.secret.SESSION_MAX_AGE), 
    },
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/event", eventRoute)
app.use("/api/newsBlog", newsBlogRoute)
app.use("/api/timeAward", timeAward)


app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});




async function startServer() {
  try {

    await checkDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  
  } catch (error) {
    console.error("Failed to connect to Neon PostgreSQL:", error);
    process.exit(1);
  }
}

startServer();