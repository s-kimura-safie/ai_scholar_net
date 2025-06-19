import axios from 'axios';

// Cohere APIを使用して要約を生成する関数
export async function summarizeWithCohere(text) {
    const prompt = `
次の「論文の内容」を読み取り、以下の「フォーマット」に従って、それぞれの項目を200文字程度の日本語で要約してください。

--- 論文の内容 ---
${text}

--- フォーマット ---
Title:
→ 英語タイトル（大文字化、小文字化を適切に行うが、基本的にタイトルそのままを記載）

◇ どんなもの？
→ 研究の背景と目的、全体像をざっくり説明

◇ 先行研究と比べてどこがすごい？
→ 従来手法に比べての新規性・優位性・貢献点について

◇ 技術や手法のキモはどこ？
→ この研究の中核となる技術的工夫・手法・アルゴリズムについて
`;
    // API Documentation: https://docs.cohere.com/v1/reference/generate
    const response = await axios.post(
        'https://api.cohere.ai/v1/generate', {
            model : 'command-r-plus',
            prompt,
            max_tokens : 20000,
            temperature : 0.5,
        },
        {
            headers : {
                Authorization : `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type' : 'application/json',
            },
        });

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
