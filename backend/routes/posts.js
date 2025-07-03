import { Router } from "express";
const router = Router();
import Post from "../models/Post.js";
import User from "../models/User.js";
import Paper from "../models/Paper.js";

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
            if (post.paperId) {
                await Paper.deleteOne({ paperId: post.paperId });
            }
            await post.deleteOne();
            return res.status(200).json("The post was deleted");
        } else {
            return res.status(403).json("You can only delete your post");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

// 検索キーワードを含む投稿を取得
router.post("/search", async (req, res) => {
    try {
        const keyword = req.body.keyword?.trim() || "";
        const posts = req.body.posts || [];

        if (!keyword) {
            return res.status(200).json(posts);
        }

        const lowerKeyword = keyword.toLowerCase();

        // ユーザー情報を取得
        const userIds = posts.map(post => post.userId);
        const users = userIds.length > 0 ? await User.find({ _id: { $in: userIds } }) : [];
        const userMap = Object.fromEntries(users.map(user => [user._id, user.username]));

        // 論文情報を取得
        const paperIds = posts.filter(post => post.paperId).map(post => post.paperId);
        const papers = paperIds.length > 0 ? await Paper.find({ paperId: { $in: paperIds } }) : [];
        const paperMap = Object.fromEntries(papers.map(paper => [paper.paperId, paper]));

        // 検索キーワードに一致する投稿をフィルタリング
        const filteredPosts = posts.filter((post) => {
            const username = userMap[post.userId]?.toLowerCase() || "";

            // 投稿内容とユーザー名での検索
            if (post.desc?.toLowerCase().includes(lowerKeyword) || username.includes(lowerKeyword)) {
                return true;
            }

            // 論文情報での検索
            const paper = paperMap[post.paperId];
            if (!paper) return false;

            const paperTitle = paper.title?.toLowerCase() || "";
            const paperAbstract = paper.abstract?.toLowerCase() || "";
            const paperVenue = paper.venue?.toLowerCase() || "";
            const paperAuthors = paper.authors?.join(" ").toLowerCase() || "";
            const paperFields = paper.fieldsOfStudy?.join(" ").toLowerCase() || "";
            const paperKeywords = paper.keywords?.map(k => k.word).join(" ").toLowerCase() || "";

            return (
                paperTitle.includes(lowerKeyword) ||
                paperAbstract.includes(lowerKeyword) ||
                paperVenue.includes(lowerKeyword) ||
                paperAuthors.includes(lowerKeyword) ||
                paperFields.includes(lowerKeyword) ||
                paperKeywords.includes(lowerKeyword)
            );
        });

        return res.status(200).json(filteredPosts);
    } catch (err) {
        console.error("Error in search endpoint:", err);
        return res.status(500).json({ error: "Internal Server Error" });
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
            await post.updateOne({ $push: { likes: req.body.userId } }); // 投稿に❤したユーザーを追加
            res.status(200).json("Successfully liked");
        }
        else {
            await post.updateOne({ $pull: { likes: req.body.userId } }); // 投稿に❤を取り消す
            res.status(200).json("Successfully unliked");
        }
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Get likes
router.get("/:id/likes", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        return res.status(200).json(post.likes);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Get users who liked the post
router.get("/:id/likedUsers", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const likedUsers = await User.find({ _id: { $in: post.likes } }).select('username profilePicture');
        return res.status(200).json(likedUsers);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Put a comment
router.put("/:id/comment", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = {
            userId: req.body.userId,
            username: req.body.username,
            text: req.body.text
        };
        await post.updateOne({
            $push: {
                comments: comment
            }
        });
        return res.status(200).json(comment);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Get comments
router.get("/:id/comments", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comments = post.comments;

        // ユーザー情報を補完する
        const enrichedComments = await Promise.all(
            comments.map(async (comment) => {
                const user = await User.findById(comment.userId);
                return {
                    ...comment.toObject(),
                    profilePicture: user ? user.profilePicture : null
                };
            })
        );

        return res.status(200).json(enrichedComments);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// Get posts liked by a user
router.get("/liked-posts/:userId", async (req, res) => {
    try {
        const posts = await Post.find({ likes: req.params.userId });
        return res.status(200).json(posts);
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

export default router;
