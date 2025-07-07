import axios from 'axios';

import Paper from '../models/Paper.js';
import keywordSelector from "./keywordSelector.js";


// 論文検索APIを呼び出す共通関数
async function excuteSemanticScholarAPI(query, offset, limit) {
    try {
        // 検索内容:
        // https://www.semanticscholar.org/search?year%5B0%5D=2023&year%5B1%5D=2025&fos%5B0%5D=engineering&fos%5B1%5D=computer-science&q=conputer%20vision&sort=total-citations&pdf=true
        const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
            params: {
                query,
                fields:
                    'paperId,title,authors,year,abstract,fieldsOfStudy,venue,citationCount,referenceCount,url,openAccessPdf',
                limit: limit,
                offset: offset,
                year: '2023-',
                openAccessPdf: true,
                fieldsOfStudy: 'Computer Science',
                sort: 'citationCount:desc'
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching data from Semantic Scholar API:', error.message);
        // throw error;
        return [];
    }
}

// 論文を検索する
export async function searchPapers(query, searchPaperNum) {
    let results = [];
    let attempts = 1;
    const requestPaperNum = 10; // 一度のAPI呼び出しで取得する論文数
    const maxAttempts = 10;       // 最大試行回数
    const delay = 60000;         // 1分の待機時間

    while (results.length < searchPaperNum && attempts < maxAttempts) {
        // API制限回避のため、呼び出し間に待機時間を挿入
        if (attempts > 1) {
            console.log(`Waiting for ${delay / 1000}sec before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 乱数を使用して0~10でオフセットを計算
        const offfsetPage = Math.floor(Math.random() * 5);
        console.log(`Attempt ${attempts}: Fetching papers at pege ${offfsetPage}...`);
        const papers = await excuteSemanticScholarAPI(query, offfsetPage, requestPaperNum);
        console.log(`Fetched ${papers.length} papers from Semantic Scholar API.`);

        for (const paper of papers) {
            // paperId で照合して既にデータベースにある場合はスキップ
            const isExistingPaper = await Paper.findOne({ paperId: paper.paperId });
            if (isExistingPaper) {
                console.log(`Skipping already posted paper: ${paper.title}`);
                continue;
            }

            // 論文のキーワードを取得
            const keywords = await keywordSelector(paper.title, paper.abstract);
            const formattedKeywords = Object.entries(keywords).map(([word, score]) => ({
                word,
                score
            }));

            results.push({
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
                keywords: formattedKeywords
            });

        }

        attempts++;
    }

    console.log(`Search completed. Found ${results.length} accessible papers out of ${searchPaperNum} requested.`);
    return results;
}
