import axios from "axios";
import express from "express";
import mongoose from "mongoose";

import Paper from "../models/Paper.js";
import { searchPapers } from "../searcher/searchScholar.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { query, requestPaperNum } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        console.log(`Searching for ${requestPaperNum} papers with query: ${query}`);
        const searchedPapers = await searchPapers(query, requestPaperNum);
        if (searchedPapers.length === 0) {
            return res.status(404).json({ error: 'No new papers found' });
        } else {
            console.log(`Found ${searchedPapers.length} new papers`);
        }

        // 検索した論文をデータベースに保存
        for (const paper of searchedPapers) {
            await Paper.findOneAndUpdate({ paperId: paper.paperId }, paper, { upsert: true, new: true });
        }

        res.json({ searchedPapers });
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

// 論文のメタデータを取得するエンドポイント
router.get('/:id/metadata', async (req, res) => {
    const { id } = req.params;

    try {
        const paper = await Paper.findOne({ paperId: id }); // paperIdで検索

        if (!paper) {
            console.error('Paper not found:', id);
            return res.status(404).json({ error: 'Paper not found' });
        }

        res.json({
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            fieldsOfStudy: paper.fieldsOfStudy,
            venue: paper.venue,
            citationCount: paper.citationCount,
            referenceCount: paper.referenceCount,
            url: paper.url,
            keywords: paper.keywords
        });

    } catch (error) {
        console.error('Error fetching paper metadata:', error);
        res.status(500).json({ error: 'Failed to fetch paper metadata' });
    }
});

export default router;
