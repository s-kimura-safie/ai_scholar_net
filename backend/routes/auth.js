import { Router } from "express";
import User from "../models/User.js"; // 修正: ファイル拡張子を追加

const router = Router();

// ログイン
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            console.log("ユーザーが見つかりません");
            return res.status(404).json("ユーザーが見つかりません");
        }
        const validPassword = user.password === req.body.password;
        if (!validPassword) {
            console.log("パスワードが間違っています");
            return res.status(400).json("パスワードが間違っています");
        }
        return res.status(200).json(user);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

// ユーザ登録
router.post("/register", async (req, res) => {
    try {
        const newUser = await new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        });
        const user = await newUser.save();
        return res.status(200).json(user)
    }
    catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
});

export default router;
