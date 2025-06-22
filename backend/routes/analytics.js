import express from "express";
import Post from "../models/Post.js";
import Paper from "../models/Paper.js";

const router = express.Router();

// 共通のキーワード集計関数
const aggregateKeywords = (papers) => {
    const keywordStats = new Map();

    papers.forEach((paper, paperIndex) => {
        if (paper.keywords && Array.isArray(paper.keywords)) {
            paper.keywords.slice(0, 5).forEach((keyword, keywordIndex) => {
                // キーワードのバリデーション
                if (!keyword || !keyword.word || typeof keyword.word !== 'string' || keyword.word.trim() === '') {
                    return;
                }

                const word = keyword.word.toLowerCase().trim();
                keywordStats.set(word, (keywordStats.get(word) || 0) + 1);
            });
        }
    });

    return keywordStats;
};

// キーワード統計を配列に変換してソート
const formatKeywordStats = (keywordStats, limit = 20) => {
    return Array.from(keywordStats.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

// ❤された論文のキーワード分析（ハートの総数でカウント）
router.get("/popular-keywords", async (req, res) => {
    try {
        // ❤が1つ以上ある投稿を取得
        const likedPosts = await Post.find({
            paperId: { $exists: true, $ne: null },
            likes: { $ne: [] }
        });
        console.log(`Found ${likedPosts.length} liked posts`);

        if (likedPosts.length === 0) {
            return res.status(200).json([]);
        }

        // 投稿から論文IDを抽出し、対応する論文を取得
        const paperIds = likedPosts.map(post => post.paperId);
        const papers = await Paper.find({ paperId: { $in: paperIds } });

        // 論文IDとPaperオブジェクトのマップを作成
        const paperMap = new Map();
        papers.forEach(paper => {
            paperMap.set(paper.paperId, paper);
        });

        const keywordStats = new Map();

        // 各投稿について、そのハート数分だけキーワードをカウント
        likedPosts.forEach((post, postIndex) => {
            const paper = paperMap.get(post.paperId);
            if (!paper) return;

            const heartCount = post.likes.length; // このポストのハート数

            if (paper.keywords && Array.isArray(paper.keywords)) {
                paper.keywords.slice(0, 5).forEach((keyword, keywordIndex) => {
                    if (!keyword || !keyword.word || typeof keyword.word !== 'string' || keyword.word.trim() === '') {
                        console.log(`Keyword ${keywordIndex} is invalid:`, keyword);
                        return;
                    }

                    const word = keyword.word.toLowerCase().trim();

                    if (keywordStats.has(word)) {
                        keywordStats.set(word, keywordStats.get(word) + heartCount);
                    } else {
                        keywordStats.set(word, heartCount);
                    }
                });
            } else {
                console.log(`Paper ${postIndex + 1} has no keywords or keywords is not an array`);
            }
        });

        // マップを配列に変換してソート
        const sortedKeywords = Array.from(keywordStats.entries())
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // 上位20個のキーワードを取得

        res.status(200).json(sortedKeywords);
    } catch (error) {
        console.error("Error fetching liked papers keywords:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// ❤数別キーワード分析 - ❤数の範囲別にキーワード傾向を比較
router.get("/keywords-by-popularity", async (req, res) => {
    try {
        // すべての投稿を取得
        const posts = await Post.find({
            paperId: { $exists: true, $ne: null }
        });

        const paperIds = posts.map(post => post.paperId);
        const papers = await Paper.find({ paperId: { $in: paperIds } });

        // 論文IDとPaperオブジェクトのマップを作成
        const paperMap = new Map();
        papers.forEach(paper => {
            paperMap.set(paper.paperId, paper);
        });

        // ❤数の範囲定義
        const likeRanges = [
            { min: 0, max: 1, label: "❤1" },
            { min: 2, max: 3, label: "❤2~3" },
            { min: 4, max: 5, label: "❤4~5" },
            { min: 6, max: Infinity, label: "❤6+" }
        ];

        const result = likeRanges.map(range => {
            // 範囲内の投稿に関連する論文を取得
            const papersInRange = [];

            posts.forEach(post => {
                const likeCount = post.likes.length;
                if (likeCount >= range.min && likeCount <= range.max) {
                    const paper = paperMap.get(post.paperId);
                    if (paper) {
                        papersInRange.push(paper);
                    }
                }
            });

            // この範囲のキーワードを集計
            const keywordStats = aggregateKeywords(papersInRange);
            const topKeywords = formatKeywordStats(keywordStats, 10);

            return {
                range: range.label,
                keywords: topKeywords
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching keywords by popularity:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 総❤数取得
router.get("/total-likes", async (req, res) => {
    try {
        // すべての投稿を取得
        const posts = await Post.find({
            paperId: { $exists: true, $ne: null }
        });

        // 総❤数を計算
        const totalLikes = posts.reduce((total, post) => {
            return total + (post.likes ? post.likes.length : 0);
        }, 0);

        res.status(200).json({ totalLikes });
    } catch (error) {
        console.error("Error fetching total likes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ❤された論文のキーワード分析（ハート数と論文数の両方）
router.get("/popular-keywords-detailed", async (req, res) => {
    try {
        // ❤が1つ以上ある投稿を取得
        const likedPosts = await Post.find({
            paperId: { $exists: true, $ne: null },
            likes: { $ne: [] }
        });
        console.log(`Found ${likedPosts.length} liked posts`);

        if (likedPosts.length === 0) {
            return res.status(200).json([]);
        }

        // 投稿から論文IDを抽出し、対応する論文を取得
        const paperIds = likedPosts.map(post => post.paperId);
        const papers = await Paper.find({ paperId: { $in: paperIds } });

        // 論文IDとPaperオブジェクトのマップを作成
        const paperMap = new Map();
        papers.forEach(paper => {
            paperMap.set(paper.paperId, paper);
        });

        const keywordStats = new Map(); // ハート数のカウント
        const keywordPaperCount = new Map(); // 論文数のカウント

        // 各投稿について、そのハート数分だけキーワードをカウント
        likedPosts.forEach((post, postIndex) => {
            const paper = paperMap.get(post.paperId);
            if (!paper) return;

            const heartCount = post.likes.length; // このポストのハート数
            const processedKeywords = new Set(); // この論文で既に処理したキーワード

            if (paper.keywords && Array.isArray(paper.keywords)) {
                paper.keywords.slice(0, 5).forEach((keyword, keywordIndex) => {
                    if (!keyword || !keyword.word || typeof keyword.word !== 'string' || keyword.word.trim() === '') {
                        return;
                    }

                    const word = keyword.word.toLowerCase().trim();

                    // ハート数をカウント
                    if (keywordStats.has(word)) {
                        keywordStats.set(word, keywordStats.get(word) + heartCount);
                    } else {
                        keywordStats.set(word, heartCount);
                    }

                    // 論文数をカウント（同じ論文内で重複しないように）
                    if (!processedKeywords.has(word)) {
                        if (keywordPaperCount.has(word)) {
                            keywordPaperCount.set(word, keywordPaperCount.get(word) + 1);
                        } else {
                            keywordPaperCount.set(word, 1);
                        }
                        processedKeywords.add(word);
                    }
                });
            }
        });

        // マップを配列に変換してハート数でソート
        const sortedKeywords = Array.from(keywordStats.entries())
            .map(([keyword, heartCount]) => ({
                keyword,
                heartCount,
                paperCount: keywordPaperCount.get(keyword) || 0
            }))
            .sort((a, b) => b.heartCount - a.heartCount)
            .slice(0, 20); // 上位20個のキーワードを取得

        res.status(200).json(sortedKeywords);
    } catch (error) {
        console.error("Error fetching detailed keywords:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
