import express from "express";
import axios from "axios";
import { searchPapers } from "../searcher/searchScholar.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Paper from "../models/Paper.js";

const router = express.Router();

// __dirname の代替設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 既にサーチした論文のIDを保持するセット
const searchedPaperIds = new Set();

// ファイル名を安全にするためのサニタイズ関数
function sanitizeFileName(name) {
    sanitized_name = name.replace(/[^a-z0-9_\-]/gi, '_').substring(0, 100); // 不正な文字を置換し、長さを制限
    sanitize_name = sanitized_name.replace(/__+/g, '_'); // 連続するアンダースコアを1つに
    return sanitize_name;
}

// PDFをダウンロードして保存する
async function savePdf(paper, pdfDir) {
    const sanitizedTitle = sanitizeFileName(paper.title);
    const pdfPath = path.resolve(pdfDir, `${sanitizedTitle}.pdf`);

    const pdfResponse = await axios.get(paper.pdfPath, { responseType: 'stream' });
    const writer = fs.createWriteStream(pdfPath);
    pdfResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return pdfPath;
}

router.post("/", async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const pdfDir = path.resolve(__dirname, '../public/pdfs');
        const results = await searchPapers(query);

        for (const paper of results) {
            const pdfPath = await savePdf(paper, pdfDir);

            const paperData = {
                ...paper,
                pdfPath,
            };

            await Paper.findOneAndUpdate(
                { paperId: paper.paperId },
                paperData,
                { upsert: true, new: true }
            );
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No new papers found today' });
        }

        res.json({ results });
        console.log(`Date: ${new Date().toISOString().split('T')[0]}, New papers: ${results.length}`);
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

export default router;
