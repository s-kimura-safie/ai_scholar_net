import schedule from "node-schedule";

import Paper from "../models/Paper.js";
import Post from "../models/Post.js";

import extractPdfText from "./pdfParser.js";
import {searchPapers} from "./searchScholar.js";
import summarizer from "./summarizer.js";

// スケジュールタスクを設定
function initializeScheduler() {
    schedule.scheduleJob('00 09 * * 1-5', async () => { // 月~金の0時に投稿
        console.log('Bot is running to post papers');

        try {
            const query = 'Computer vision';                            // 検索クエリ
            const postingPaperNum = 1;                                  // 一度に投稿する論文の数
            const results = await searchPapers(query, postingPaperNum); // 論文を検索

            for (const paper of results) {
                // 要約作成
                try {
                    const pdfText = await extractPdfText(paper.pdfPath);
                    const summary = await summarizer(pdfText);

                    // 検索した論文の要約をボットの Post としてデータベースに保存
                    const newPost = new Post({
                        userId : '6803c93270fbdf7e2ea0bcc7', // ボットアカウントのユーザーID
                        desc : `${summary}`,
                        createdAt : new Date(),
                        paperId : paper.paperId
                    });

                    await newPost.save();

                    // 検索した論文を Paper のデータベースに保存
                    await Paper.findOneAndUpdate({paperId : paper.paperId}, paper, {upsert : true, new : true});

                } catch (error) {
                    console.error(`Error occured in summarizeing paper "${paper.title}"\n`, error);
                    continue;
                }
            }

            console.log('Bot has posted papers successfully');
        } catch (error) {
            console.error('Error in bot task:', error);
        }
    });
}

export default initializeScheduler;
