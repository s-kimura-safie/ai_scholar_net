import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";

import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import postRoute from "./routes/posts.js";
import uploadRoute from "./routes/upload.js";
import searchScholarRoute from "./routes/scholar.js";
import analyticsRoute from "./routes/analytics.js";
import setScheduler from "./searcher/scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env' });

const app = express();
const PORT = 8008;

// ボットの論文投稿スケジュールを初期化
setScheduler();

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
app.use(
    "/images",
    express.static(path.join(__dirname, "public/images"), {
        maxAge: "7d", // 7日間キャッシュ
        immutable: true, // ファイルが変更されない場合にキャッシュを最適化
        setHeaders: (res, path) => {
            res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // 7日間キャッシュ
        },
    })
);

app.use(express.json());
app.use("/api/users", userRoute); // /api/users にアクセスしたら、userRouteを使う
app.use("/api/auth", authRoute); // /api/auth にアクセスしたら、authRouteを使う
app.use("/api/posts", postRoute); // /api/posts にアクセスしたら、postRouteを使う
app.use("/api/upload", uploadRoute); // /api/upload にアクセスしたら、uploadRouteを使う
app.use("/api/scholar", searchScholarRoute); // /api/scholar にアクセスしたら、searchScholarRouteを使う
app.use("/api/analytics", analyticsRoute); // /api/analytics にアクセスしたら、analyticsRouteを使う

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
