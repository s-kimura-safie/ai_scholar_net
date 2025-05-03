const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Paper = require('../models/Paper');

// ファイル名を安全にするためのサニタイズ関数
function sanitizeFileName(name) {
    sanitized_name = name.replace(/[^a-z0-9_\-]/gi, '_').substring(0, 100); // 不正な文字を置換し、長さを制限
    sanitize_name = sanitized_name.replace(/__+/g, '_'); // 連続するアンダースコアを1つに
    return sanitize_name;
}

router.post('/', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
            params: {
                query,
                fields: 'paperId,title,authors,year,abstract,fieldsOfStudy,venue,citationCount,referenceCount,url,openAccessPdf',
                limit: 5,
                year: '2023-2025',
                openAccessPdf: true,
                venue: "CVPR",
                minCitationCount: 50,
                sort: 'citationCount:desc'
            }
        });

        const papers = response.data.data;

        // ./public/pdfsディレクトリを作成（存在しない場合）
        const pdfDir = path.resolve(__dirname, '../public/pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        const results = [];

        for (const [index, paper] of papers.entries()) {
            console.log(`${index + 1}. ${paper.title} (${paper.year})`);
            if (paper.openAccessPdf && paper.openAccessPdf.url) {

                // 論文タイトルをファイル名として使用（サニタイズ済み）
                const sanitizedTitle = sanitizeFileName(paper.title);
                const pdfPath = path.resolve(pdfDir, `${sanitizedTitle}.pdf`);

                // PDFをダウンロードして保存
                const pdfResponse = await axios.get(paper.openAccessPdf.url, { responseType: 'stream' });
                const writer = fs.createWriteStream(pdfPath);
                pdfResponse.data.pipe(writer);

                // ダウンロード完了を待つ
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // MongoDBに保存
                const paperData = {
                    paperId: paper.paperId,
                    title: paper.title,
                    authors: paper.authors.map(author => author.name),
                    year: paper.year,
                    abstract: paper.abstract,
                    fieldsOfStudy: paper.fieldsOfStudy,
                    venue: paper.venue,
                    citationCount: paper.citationCount,
                    referenceCount: paper.referenceCount,
                    url: paper.url,
                    pdfPath,
                };

                await Paper.findOneAndUpdate(
                    { paperId: paper.paperId },
                    paperData,
                    { upsert: true, new: true }
                );

                results.push({ ...paperData });
            } else {
                console.log('   No open access PDF available.');
            }
        }

        res.json({ "results": results });
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

module.exports = router;
