import express from "express";
import mongoose from "mongoose";
import axios from "axios";

import Paper from "../models/Paper.js";
import { searchPapers } from "../searcher/searchScholar.js";
import summarizer from "../searcher/summarizer.js";
import extractPdfText from "../searcher/pdfParser.js";


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
            return res.status(404).json({ error: 'No new papers found today' });
        }
        else {
            console.log(`Found ${searchedPapers.length} new papers`);
        }

        for (const paper of searchedPapers) {
            // 要約作成
            try {
                const pdfText = await extractPdfText(paper.pdfPath);
                paper.summary = await summarizer(pdfText);
            } catch (error) {
                console.error(`Error in summarizeing paper: ${paper.title}:`, error);
                continue;
            }

            // 検索した論文をデータベースに保存
            await Paper.findOneAndUpdate(
                { paperId: paper.paperId },
                paper,
                { upsert: true, new: true }
            );
        }

        res.json({ searchedPapers });
        console.log(`Date: ${new Date().toISOString().split('T')[0]}, New papers: ${searchedPapers.length}`);
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
        });

    } catch (error) {
        console.error('Error fetching paper metadata:', error);
        res.status(500).json({ error: 'Failed to fetch paper metadata' });
    }
});

export default router;
