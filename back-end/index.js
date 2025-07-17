const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const whatsappRouter = require("./routes/whatsappRouter");
const userRouter = require("./routes/userRouter");
const jobdeskRouter = require("./routes/jobdeskRouter");
const authRouter = require("./routes/authRouter");
const eventRouter = require("./routes/eventRouter");
const forgotPasswordRouter = require("./routes/forgotPasswordRouter");
const attendanceRouter = require("./routes/attendanceRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const port = process.env.PORT
const cookieParser = require("cookie-parser");
const StartEventStatusCron = require("./utils/event-status-update");
const AutoAbsentCron = require("./utils/attencance-status");
const AutoCantCron = require("./utils/auto-Cant");
const connect = require("./utils/connect");

const allowedOrigins = {
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/whatsapp", whatsappRouter);
app.use("/user", userRouter);
app.use("/jobdesk", jobdeskRouter);
app.use("/auth", authRouter);
app.use("/event", eventRouter);
app.use("/forgot-password", forgotPasswordRouter);
app.use("/attendance", attendanceRouter);
app.use("/dashboard", dashboardRouter);
app.get('/', (req, res) => {
    res.send("合格できるといいですね")
})

const startServer = async () => {
    await connect();
    StartEventStatusCron();
    AutoAbsentCron();
    AutoCantCron();
    // AutoCanCron();

    app.listen(port, () => {
        console.log(`Server berjalan di http://localhost:${port}`);
    })
}

startServer();
