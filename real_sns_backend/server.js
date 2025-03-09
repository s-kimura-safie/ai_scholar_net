const express = require("express");
const app = express();
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const uploadRoute = require("./routes/upload");
const POST = 5000;
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// connect to MongoDB
mongoose
    .connect(process.env.MONGOURL) //process はNode.jsのグローバルオブジェクトの1つで、環境変数を取得するために使用されます。
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log(err);
    });

// Set middleware
// localserver のパス /images にアクセスしたら、サーバーに保存された public/images の性的ファイルを使う
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use(express.json());
app.use("/api/users", userRoute); // /api/usersにアクセスしたら、userRouteを使う
app.use("/api/auth", authRoute); // /api/authにアクセスしたら、authRouteを使う
app.use("/api/posts", postRoute); // /api/postsにアクセスしたら、postRouteを使う
app.use("/api/upload", uploadRoute); // /api/uploadにアクセスしたら、uploadRouteを使う

app.get("/", (req, res) => {
    res.send("Hello World");
});
app.listen(POST, () => {
    console.log("Backend server is running!");
});
