import axios from 'axios';


// Cohere APIを使用して要約を生成する関数
export async function summarizeWithCohere(text) {
    const prompt = `
次の「論文の内容」を以下の形式でそれぞれ200文字程度で要約してください：
Title: Paper title (rewrite into a natural, readable format in English with proper capitalization)

◇ どんなもの？

◇ 先行研究と比べてどこがすごい？

◇ 技術や手法のキモはどこ？

--- 論文の内容 ---
${text}
`;
    // API Documentation: https://docs.cohere.com/v1/reference/generate
    const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
            model: 'command-r-plus',
            prompt,
            max_tokens: 20000,
            temperature: 0.5,
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
export async function summarizePaper(pdfText) {
    try {
        const summary = await summarizeWithCohere(pdfText);
        return summary;
    } catch (err) {
        console.error('❌ エラー:', err.message);
        throw err;
    }
}

export default summarizePaper;
