import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module'; // CommonJSモジュールを使用するためのrequire関数を作成
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import axios from 'axios';
import dotenv from 'dotenv';


// 環境変数の読み込み
dotenv.config({ path: '../.env' });
console.log('Cohere API Key:', process.env.COHERE_API_KEY);

// __dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PDFファイルの絶対パス
const PDF_PATH = path.resolve(__dirname, "../public/pdfs/FFCV_Accelerating_Training_by_Removing_Data_Bottlenecks.pdf");

// PDFからテキストを抽出する関数
async function extractPdfText(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`指定されたPDFファイルが見つかりません: ${filePath}`);
    }
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    console.log('PDFのテキストを抽出:' + data.text.length + '文字');
    return data.text;
}

// Cohere APIを使用して要約を生成する関数
async function summarizeWithCohere(text) {
    const prompt = `
次の論文の内容を以下の形式で要約してください：

## どんなもの？

## 先行研究と比べてどこがすごい？

## 技術や手法のキモはどこ？

--- 論文の内容 ---
${text.slice(0, 5000)}
`;

    const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
            model: 'command-r-plus',
            prompt,
            max_tokens: 800,
            temperature: 0.3,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return response.data.generations[0].text.trim();
}

// メイン処理
(async () => {
    try {
        const pdfText = await extractPdfText(PDF_PATH);
        console.log('✅ PDFからテキストを抽出しました。');
        const summary = await summarizeWithCohere(pdfText);
        console.log('\n📄 要約結果:\n');
        console.log(summary);
    } catch (err) {
        console.error('❌ エラー:', err.message);
    }
})();
