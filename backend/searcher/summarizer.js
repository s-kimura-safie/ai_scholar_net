import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

// __dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PDFファイルの絶対パス
const PDF_PATH = path.resolve(__dirname, "../public/pdfs/FFCV_Accelerating_Training_by_Removing_Data_Bottlenecks.pdf");

// Cohere APIを使用して要約を生成する関数
export async function summarizeWithCohere(text) {
    const prompt = `
次の論文の内容を以下の形式でそれぞれ200文字以内で要約してください：
Title: Paper title (rewrite into a natural, readable format in English with proper capitalization)

◇ どんなもの？

◇ 先行研究と比べてどこがすごい？

◇ 技術や手法のキモはどこ？

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

// PDFを解析して要約を返す関数
export async function summarizeScholar(pdfText) {
    try {
        const summary = await summarizeWithCohere(pdfText);
        return summary;
    } catch (err) {
        console.error('❌ エラー:', err.message);
        throw err;
    }
}

// デフォルトエクスポート
export default summarizeScholar;
