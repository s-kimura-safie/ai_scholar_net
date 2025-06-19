import schedule from "node-schedule";
import Post from "../models/Post.js";
import { searchPapers } from "./searchScholar.js";


// スケジュールタスクを設定
function initializeScheduler() {
    schedule.scheduleJob('00 09 * * 1-5', async () => { // 月~金の0時に投稿
        console.log('Bot is running to post papers');

        try {
            const query = 'Computer vision'; // 検索クエリ
            const postingPaperNum = 1; // 一度に投稿する論文の数
            const results = await searchPapers(query, postingPaperNum); // 論文を検索

            for (const paper of results) {
                const newPost = new Post({
                    userId: '6803c93270fbdf7e2ea0bcc7', // ボットアカウントのユーザーID
                    desc: `${paper.summary}`,
                    createdAt: new Date(),
                    paperId: paper.paperId
                });

                await newPost.save();
            }

            console.log('Bot has posted papers successfully');
        } catch (error) {
            console.error('Error in bot task:', error);
        }
    });
}

export default initializeScheduler;
