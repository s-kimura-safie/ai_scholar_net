import axios from 'axios';

import Paper from '../models/Paper.js';

// 論文検索APIを呼び出す共通関数
async function excuteSemanticScholarAPI(query, offset, limit) {
    try {
        // 検索内容:
        // https://www.semanticscholar.org/search?year%5B0%5D=2023&year%5B1%5D=2025&fos%5B0%5D=engineering&fos%5B1%5D=computer-science&q=conputer%20vision&sort=total-citations&pdf=true
        const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
            params : {
                query,
                fields :
                    'paperId,title,authors,year,abstract,fieldsOfStudy,venue,citationCount,referenceCount,url,openAccessPdf',
                limit : limit,
                offset,
                year : '2023-',
                openAccessPdf : true,
                fieldsOfStudy : 'Computer Science',
                sort : 'citationCount:desc'
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching data from Semantic Scholar API:', error);
        // throw error;
        return [];
    }
}

// 論文を検索する
export async function searchPapers(query, searchPaperNum) {
    let results = [];
    let attempts = 0;
    const requestPaperNum = 10; // 一度のAPI呼び出しで取得する論文数
    const maxAttempts = 5;      // 最大試行回数
    const delay = 60000;        // 1分の待機時間

    while (results.length < searchPaperNum && attempts < maxAttempts) {
        // API制限回避のため、呼び出し間に待機時間を挿入
        if (attempts > 0) {
            console.log(`Waiting for ${delay / 1000}sec before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 乱数を使用して0~10でオフセットを計算
        const offfsetPage = Math.floor(Math.random() * 10);
        const papers = await excuteSemanticScholarAPI(query, offfsetPage, requestPaperNum);

        for (const paper of papers) {
            // paperId で照合して既にデータベースにある場合はスキップ
            const isExistingPaper = await Paper.findOne({paperId : paper.paperId});
            if (isExistingPaper) {
                console.log(`Skipping already posted paper: ${paper.title}`);
                continue;
            }

            if (paper.openAccessPdf.url === null) {
                console.log(`Skipping paper without open access PDF: ${paper.title}`);
                continue;
            }

            results.push({
                paperId : paper.paperId,
                title : paper.title,
                authors : paper.authors.map(author => author.name),
                year : paper.year,
                abstract : paper.abstract,
                fieldsOfStudy : paper.fieldsOfStudy,
                venue : paper.venue,
                citationCount : paper.citationCount,
                referenceCount : paper.referenceCount,
                url : paper.url,
                pdfPath : paper.openAccessPdf.url
            });

            console.log(`Found paper: ${paper.title}`);

            if (results.length >= searchPaperNum) {
                break; // 必要な数の論文が見つかったらループを抜ける
            }
        }

        attempts++;
    }

    return results;
}
