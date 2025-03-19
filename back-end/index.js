const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const connect = require("./lib/connect");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
    console.log("pembangunan sistem penjadwalan dan absensi");
    connect();
})

app.listen(process.env.PORT, () => {
    console.log(`Server berjalan pada port http://localhost:${process.env.PORT}`);
})
