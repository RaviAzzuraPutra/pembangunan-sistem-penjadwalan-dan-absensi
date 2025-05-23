const express = require("express");
const app = express();
const cors = require("cors");
const whatsappRouter = require("./routes/whatsappRouter");
const userRouter = require("./routes/userRouter");
const jobdeskRouter = require("./routes/jobdeskRouter");
const authRouter = require("./routes/authRouter");
const eventRouter = require("./routes/eventRouter");
const test = require("./routes/TestResponseRouter");
const port = process.env.PORT
const cookieParser = require("cookie-parser");
const StartEventStatusCron = require("./utils/event-status-update");
const connect = require("./utils/connect");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(cookieParser());

app.use("/whatsapp", whatsappRouter);
app.use("/user", userRouter);
app.use("/jobdesk", jobdeskRouter);
app.use("/auth", authRouter);
app.use("/event", eventRouter);
app.use("/test-face", test);

const startServer = async () => {
    await connect();
    StartEventStatusCron();

    app.listen(port, () => {
        console.log(`Server berjalan di http://localhost:${port}`);
    })
}

startServer();
