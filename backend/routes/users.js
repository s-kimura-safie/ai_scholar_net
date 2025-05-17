import express from "express";
import User from "../models/User.js";
const router = express.Router();

// ユーザー検索API
router.get("/search", async (req, res) => {
    const query = req.query.q;
    try {
        const users = await User.find({ username: { $regex: query, $options: "i" } }).select("-password -updatedAt");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: "検索に失敗しました" });
    }
});

// Query で取得
router.get("/", async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;
    try {
        const user = userId ? await User.findById(userId) : await User.findOne({ username: username });
        const { password, updateAt, ...other } = user._doc;
        return res.status(200).json(other);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Read
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Update
router.put("/:id", async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        const { username, desc } = req.body;
        try {
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { $set: req.body }, // $set: 更新するフィールド
                { new: true } // new: true で更新後のデータを取得
            );
            res.status(200).json("Account has been updated");
        } catch (err) {
            return res.status(500).json(err);
        }
    }
    else {
        return res.status(403).json("Failed to update account");
    }
});

// Delete
router.delete("/:id", async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account has been deleted");
        } catch (err) {
            return res.status(500).json(err);
        }
    }
    else {
        return res.status(403).json("Failed to delete account");
    }
});

// ユーザーのフォロー
router.put("/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) { // フォローするユーザーが自分自身でない場合
        try {
            const user = await User.findById(req.params.id); // フォローする対象のユーザー
            const currentUser = await User.findById(req.body.userId); // フォローする自身のユーザー
            if (!user.followers.includes(req.body.userId)) { // フォローする対象のユーザーをまだフォローしていない場合
                await user.updateOne({ $push: { followers: req.body.userId } }); // フォローするユーザーにフォロワーを追加
                await currentUser.updateOne({ $push: { followings: req.params.id } }); // フォローするユーザーにフォローしているユーザーを追加
                res.status(200).json("Successfully followed");
            }
            else {
                res.status(403).json("You already follow this user");
            }
        } catch (err) {
            return res.status(500).json(err);
        }
    }
    else {
        return res.status(403).json("You can't follow yourself");
    }
});

// ユーザーのフォロー解除
router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) { // フォローするユーザーが自分自身でない場合
        try {
            const user = await User.findById(req.params.id); // フォローする対象のユーザー
            const currentUser = await User.findById(req.body.userId); // フォローする自身のユーザー
            if (user.followers.includes(req.body.userId)) { // フォローする対象のユーザーをまだフォローしていない場合
                await user.updateOne({ $pull: { followers: req.body.userId } }); // フォローするユーザーにフォロワーを追加
                await currentUser.updateOne({ $pull: { followings: req.params.id } }); // フォローするユーザーにフォローしているユーザーを追加
                res.status(200).json("Successfully unfollowed");
            }
            else {
                res.status(403).json("You don't follow this user");
            }
        } catch (err) {
            return res.status(500).json(err);
        }
    }
    else {
        return res.status(403).json("You can't unfollow yourself");
    }
});

export default router;
