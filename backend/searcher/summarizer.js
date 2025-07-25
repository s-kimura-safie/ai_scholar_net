import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

// プロンプトを構築する関数
function buildSummaryPrompt(text) {
    const prompt = `あなたは論文要約の専門家です。以下の論文内容を読み取り、指定のフォーマットに沿って日本語で要約してください。

【重要な指示】
- 必ず日本語で要約してください
- 英語の原文をそのまま出力しないでください
- 以下のフォーマットを厳密に守ってください

【出力フォーマット】
タイトル: [英語論文タイトル]

◇ 一言でいうと？
[25-75文字で、論文の主題や目的を簡潔に記述]

◇ どんなもの？
[180-220文字で、背景・課題・目的を明確に記述]

◇ 先行研究と比べてどこがすごい？
[180-220文字で、何が新しく、従来技術との違いを具体的に記述]

◇ 技術や手法のキモはどこ？
[180-220文字で、提案手法の要点と仕組み・工夫点を明確に記述]

【論文の内容】
${text}

必ず日本語で指定した文字数の範囲内で要約してください。`;

    return prompt;
}


// Cohere APIを使用して要約を生成する関数
export async function summarizeWithCohere(text) {

    // 入力テキストを適切な長さに制限
    const maxInputLength = 250000;
    const truncatedText = text.length > maxInputLength ?
        text.substring(0, maxInputLength) + "..." : text;

    const prompt = buildSummaryPrompt(truncatedText);

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

// 再試行用の関数（Gemini APIを利用）
async function summarizeWithGemini(text) {
    console.log('Summarizing with Gemini AI...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    const ai = new GoogleGenAI({ apiKey });

    const maxInputLength = 100000;
    const truncatedText = text.length > maxInputLength ?
        text.substring(0, maxInputLength) + "..." : text;

    const prompt = buildSummaryPrompt(truncatedText);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Geminiのレスポンスから要約テキストを抽出
    // GoogleGenAI SDKの返却値は response.candidates[0].content.parts[0].text 形式
    if (response && response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        if (parts && parts.length > 0 && parts[0].text) {
            return parts[0].text.trim();
        }
    }
    throw new Error('Gemini APIから要約テキストが取得できませんでした');
}

// タイトルとアブストラクトから要約を生成する関数
export async function abstructSummarize(title, abstract) {
    const prompt = `
あなたは論文要約の専門家です。
【論文の内容】を読み取り、【出力フォーマット】の4点について、それぞれ100文字以内の簡潔な日本語で記述してください。
【出力フォーマット】を厳密に守ってください。
タイトルは英文のまま出力してください。

【出力フォーマット】
タイトル:
◇ 論文の概要
◇ 従来技術との違い
◇ 提案手法の仕組み・工夫点
◇ 結果と結論

【論文の内容】
タイトル: ${title}
アブストラクト: ${abstract}
`;

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
        const summary = await summarizeWithGemini(pdfText);

        if (!validateSummaryOutput(summary)) {
            console.warn('⚠️ 要約出力の品質が不十分なため、再試行します...');
            // 2回目の試行（Cohereで要約）
            const retrySummary = await summarizeWithCohere(pdfText);
            if (!validateSummaryOutput(retrySummary)) {
                console.warn('⚠️ 再試行でも要約出力の品質が不十分です。');
                return null; // 再試行でも品質が不十分な場合はnullを返す
            }
            return retrySummary;
        }
        return summary;

    } catch (err) {
        console.error('❌ エラー:', err.message);
        return null; // エラーが発生した場合はnullを返す
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

export default summarizePaper;
