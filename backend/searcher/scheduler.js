import schedule from "node-schedule";

import Paper from "../models/Paper.js";
import Post from "../models/Post.js";

import extractPdfText from "./pdfParser.js";
import { searchPapers } from "./searchScholar.js";
import summarizer from "./summarizer.js";

// スケジュールタスクを設定
function setScheduler() {
    schedule.scheduleJob('00 09 * * 1-5', async () => { // 月~金の9時に投稿
        console.log('Bot is running to post papers');

        try {
            const query = 'Computer vision'; // 検索クエリ
            const postingPaperNum = 2; // 一度に投稿する論文の数
            const results = await searchPapers(query, postingPaperNum); // 論文を検索

            let postedPaperCount = 0;
            for (const paper of results) {
                // 要約作成
                let summary = '';

                try {
                    const pdfText = await extractPdfText(paper.pdfPath);
                    summary = await summarizer(pdfText);
                } catch (error) {
                    console.error(`Error summarizing paper ${paper.title}:`, error);
                    // 要約が失敗した場合は、論文のタイトルとアブストractを使用
                    summary = `多忙のため要約できませんでしたが、注目の論文なので紹介します。\n
                    Title: ${paper.title}\nAbstract: ${paper.abstract}`;
                }

                // 検索した論文の要約をボットの Post としてデータベースに保存
                const newPost = new Post({
                    userId: '68568248fc5027153a504774', // ボットアカウントのユーザーID
                    desc: `${summary} `,
                    createdAt: new Date(),
                    paperId: paper.paperId
                });

                await newPost.save();

                // 検索した論文を Paper のデータベースに保存
                await Paper.findOneAndUpdate(
                    { paperId: paper.paperId },
                    { $set: paper },
                    { upsert: true, new: true }
                );

                postedPaperCount++;
                console.log(`Posted paper: ${paper.title}`);

                if (postedPaperCount >= postingPaperNum) {
                    break; // 必要な数の論文が見つかったらループを抜ける
                }

            }

            console.log('Bot has posted papers successfully');
        } catch (error) {
            console.error('Error in bot task:', error);
        }
    });
}

export default setScheduler;
