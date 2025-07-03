import axios from 'axios';

// Cohere APIを使用して要約を生成する関数
export async function summarizeWithCohere(text) {

    // 入力テキストを適切な長さに制限
    const maxInputLength = 250000;
    const truncatedText = text.length > maxInputLength ?
        text.substring(0, maxInputLength) + "..." : text;

    const prompt = `あなたは論文要約の専門家です。以下の論文内容を読み取り、指定のフォーマットに沿って日本語で要約してください。

【重要な指示】
- 必ず日本語で要約してください
- 各セクションは180-220文字の範囲内で記述してください
- 英語の原文をそのまま出力しないでください
- 以下のフォーマットを厳密に守ってください

【出力フォーマット】
Title: [英語論文タイトル]

◇ どんなもの？
→ [180-220文字で、背景・課題・目的を明確に記述]

◇ 先行研究と比べてどこがすごい？
→ [180-220文字で、何が新しく、どこで従来を上回ったかを具体的に記述]

◇ 技術や手法のキモはどこ？
→ [180-220文字で、提案手法の要点と仕組み・工夫点を明確に記述]

【論文の内容】
${truncatedText}

必ず日本語で180-220文字の範囲内で要約してください。`;

    // API Documentation: https://docs.cohere.com/v1/reference/generate
    const response = await axios.post(
        'https://api.cohere.ai/v1/generate', {
        model: 'command-r-plus',
        prompt,
        max_tokens: 15000,  // 出力長を制限
        temperature: 0.1,  // より一貫性のある出力のため低く設定
        k: 0,              // トップkフィルタリングを無効化
        p: 0.95,           // トップpフィルタリング
        frequency_penalty: 0.1,  // 繰り返しを減らす
        presence_penalty: 0.1,   // 新しいトピックを促進
        stop_sequences: ["References"]  // 不要な部分で停止
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

        // 出力の品質チェック
        const isValidOutput = validateSummaryOutput(summary);

        if (!isValidOutput) {
            console.warn('⚠️ 要約出力の品質が不十分です。再試行します...');
            // 2回目の試行（より制約を強化）
            const retrySummary = await summarizeWithCohereRetry(pdfText);
            return retrySummary;
        }

        return summary;
    } catch (err) {
        console.error('❌ エラー:', err.message);
        throw err;
    }
}

// 出力品質の検証関数
function validateSummaryOutput(summary) {
    // 基本的な検証項目
    const isNotTooLong = summary.length < 2000; // 過度に長い出力を防ぐ
    const isNotTooShort = summary.length > 200; // 短すぎる出力を防ぐ
    const japaneseChars = summary.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
    const isMainlyJapanese = japaneseChars.length > summary.length * 0.3;
    return isNotTooLong && isNotTooShort && isMainlyJapanese;
}

// 再試行用の関数（より厳しい制約）
async function summarizeWithCohereRetry(text) {
    const maxInputLength = 100000; // 短く制限
    const truncatedText = text.length > maxInputLength ?
        text.substring(0, maxInputLength) + "..." : text;

    const prompt = `論文要約タスク：以下の論文を日本語で要約してください。

【絶対に守ること】
1. 必ず日本語で出力
2. 英語の原文をコピーしない
3. 各セクション200文字程度

【出力フォーマット】
Title: [論文タイトル]

◇ どんなもの？
→ [日本語で200文字程度]

◇ 先行研究と比べてどこがすごい？
→ [日本語で200文字程度]

◇ 技術や手法のキモはどこ？
→ [日本語で200文字程度]

論文内容：
${truncatedText}

必ず上記フォーマットで日本語要約を出力してください。`;

    const response = await axios.post(
        'https://api.cohere.ai/v1/generate', {
        model: 'command-r-plus',
        prompt,
        max_tokens: 1000,  // さらに制限
        temperature: 0.05, // より一貫性重視
        stop_sequences: ["---", "参考文献", "References", "Abstract", "Introduction"]
    },
        {
            headers: {
                Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

    return response.data.generations[0].text.trim();
}

export default summarizePaper;
