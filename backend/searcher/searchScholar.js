import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Paper from "../models/Paper.js";
import summarizer from "./summarizer.js"; // summarizer.jsをインポート

// __dirname の代替設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 既にサーチした論文のIDを保持するセット
const searchedPaperIds = new Set();

// 論文検索APIを呼び出す共通関数
async function excuteSemanticScholarAPI(query, offset, limit) {
    const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        params: {
            query,
            fields: 'paperId,title,authors,year,abstract,fieldsOfStudy,venue,citationCount,referenceCount,url,openAccessPdf',
            limit: limit,
            offset,
            year: '2023-2025',
            openAccessPdf: true,
            venue: "CVPR",
            minCitationCount: 50,
            sort: 'citationCount:desc'
        }
    });
    return response.data.data;
}

// PDFを保存する関数
async function savePdf(paperData, outputDir) {
    const pdfUrl = paperData.pdfPath;
    const pdfFileName = `${paperData.paperId}.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);

    const response = await axios.get(pdfUrl, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(pdfFilePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return pdfFilePath;
}

// 論文を検索する
export async function searchPapers(query) {
    let results = [];
    let attempts = 0;
    const maxAttempts = 5; // 最大試行回数
    const requestPaperNum = 5; // 1回のリクエストで取得する論文数

    while (results.length < 5 && attempts < maxAttempts) {
        attempts++;
        const papers = await excuteSemanticScholarAPI(query, attempts, requestPaperNum);

        for (const paper of papers) {
            if (searchedPaperIds.has(paper.paperId)) {
                console.log(`Skipping already searched paper: ${paper.title}`);
                continue;
            }

            if (paper.openAccessPdf && paper.openAccessPdf.url) {
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
                    pdfPath: paper.openAccessPdf.url,
                };

                // PDFを保存し、要約を生成
                try {
                    const pdfPath = await savePdf(paperData, path.resolve(__dirname, '../public/pdfs'));
                    const summary = await summarizer(pdfPath); // 修正: デフォルトエクスポートを関数として呼び出す
                    paperData.summary = summary;
                } catch (error) {
                    console.error(`Error processing paper ${paper.title}:`, error);
                    continue;
                }

                results.push(paperData);
                searchedPaperIds.add(paper.paperId);
            }
        }
    }

    return results;
}
