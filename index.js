const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

dotenv.config();

//setup express server

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>console.log('server started on port: ' + PORT));

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(cookieParser());

// connect to mongoDB

mongoose.connect(process.env.MDB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
},
(err) => {
       if (err) return console.error(err);
       console.log("connected to MongoDB");
   }
);


//set up routes

app.use("/auth", require("./routers/userRouter"));
app.use("/event", require("./routers/eventRouter"));
app.use("/contact", require("./routers/contactRouter"));
app.use("/email", require("./routers/emailRouter"));