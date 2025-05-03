const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Paper = require('../models/Paper');

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

// 論文を検索する
async function searchPapers(query) {
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

                results.push(paperData);
                searchedPaperIds.add(paper.paperId);
            }
        }
    }

    return results;
}

module.exports = searchPapers;
