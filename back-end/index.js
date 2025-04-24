const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const whatsappRouter = require("./routes/whatsappRouter");
const userRouter = require("./routes/userRouter");
const jobdeskRouter = require("./routes/jobdeskRouter");
const port = process.env.PORT

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use("/whatsapp", whatsappRouter);
app.use("/user", userRouter);
app.use("/jobdesk", jobdeskRouter);

app.listen(port, () => {
    console.log(`Server berjalan pada port http://localhost:${port}`);
});
