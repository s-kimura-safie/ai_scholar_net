// Router:express.Router()は、Express.jsのルーティング機能をモジュール化するためのミドルウェア
const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');

// Create a Post
router.post("/", async (req, res) => {
    const newPost = new Post(req.body);
    try {
        const savePost = await newPost.save();
        return res.status(200).json(savePost);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Edit a Post
router.put("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.updateOne({ $set: req.body });
            return res.status(200).json("The post was edited");
        } else {
            return res.status(403).json("You can only edit your post");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Delete a Post
router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.userId === req.body.userId) {
            await post.deleteOne();
            return res.status(200).json("The post was deleted");
        } else {
            return res.status(403).json("You can only delete your post");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Get a Post
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        return res.status(200).json(post);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Put a like
router.put("/:id/like", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } }); // 投稿にいいねしたユーザーを追加
            res.status(200).json("Successfully liked");
        }
        else {
            await post.updateOne({ $pull: { likes: req.body.userId } }); // 投稿にいいねを取り消す
            res.status(200).json("Successfully unliked");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Get timeline posts
router.get("/timeline/:userId", async (req, res) => {
    const page = parseInt(req.query.page) || 1; // クエリからページ番号を取得（デフォルトは1）
    const limit = 10; // 1ページあたりの投稿数
    const skip = (page - 1) * limit; // スキップする投稿数を計算

    try {
        const currentUser = await User.findById(req.params.userId);

        // 自分の投稿を取得
        const myPosts = await Post.find({ userId: currentUser._id })
            .sort({ createdAt: -1 }) // 作成日時で降順ソート
            .skip(skip) // スキップ
            .limit(limit); // 制限

        // フォローしているユーザーの投稿を取得
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId })
                    .sort({ createdAt: -1 }) // 作成日時で降順ソート
                    .skip(skip) // スキップ
                    .limit(limit); // 制限
            })
        );

        // 自分の投稿とフォローしているユーザーの投稿を結合
        const allPosts = myPosts.concat(...friendPosts);

        // 投稿を作成日時で降順ソート
        const sortedPosts = allPosts.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return res.status(200).json(sortedPosts);

    } catch (err) {
        console.log("error", err);
        return res.status(500).json(err);
    }
});

// Get timeline personal posts
router.get("/profile/:username", async (req, res) => {
    const page = parseInt(req.query.page) || 1; // クエリからページ番号を取得（デフォルトは1）
    const limit = 10; // 1ページあたりの投稿数
    const skip = (page - 1) * limit; // スキップする投稿数を計算

    try {

        const user = await User.findOne({ username: req.params.username });
        const posts = await Post.find({ userId: user._id })
            .sort({ createdAt: -1 }) // 作成日時で降順ソート
            .skip(skip) // スキップ
            .limit(limit); // 制限
        return res.status(200).json(posts);
    } catch (err) {
        console.log("error");
        return res.status(500).json(err);
    }
});

module.exports = router;
