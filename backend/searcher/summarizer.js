import axios from 'axios';

// Cohere APIを使用して要約を生成する関数
export async function summarizeWithCohere(text) {
    const prompt = `
以下の論文内容を読み取り、指定のフォーマットに沿って日本語で要約してください。

出力には以下の制約を守ってください：

- 各セクションは200文字前後の簡潔かつ具体的な日本語で記述してください（±10文字以内）。
- 内容が曖昧にならないよう、具体的な対象・技術・比較対象などを明記してください。
- タイトルは原文を使い、適切に英語タイトルとして整形してください（大文字化・小文字化を含む）。

--- 論文の内容 ---
${text}

--- 出力フォーマット ---
Title:
→ [英語論文タイトル]

◇ どんなもの？
→ [200±10文字で、背景・課題・目的を明確に記述]

◇ 先行研究と比べてどこがすごい？
→ [200±10文字で、何が新しく、どこで従来を上回ったかを具体的に記述]

◇ 技術や手法のキモはどこ？
→ [200±10文字で、提案手法の要点と仕組み・工夫点を明確に記述]
`;
    // API Documentation: https://docs.cohere.com/v1/reference/generate
    const response = await axios.post(
        'https://api.cohere.ai/v1/generate', {
        model: 'command-r-plus',
        prompt,
        max_tokens: 20000,
        temperature: 0.3,
    },
        {
            headers: {
                Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

    return response.data.generations[0].text.trim();
}

// テキスト形式の論文を解析して要約を返す関数
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
