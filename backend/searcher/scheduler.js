const schedule = require('node-schedule');
const Post = require('../models/Post');
const searchScholar = require('../searcher/searchScholar');

// スケジュールタスクを設定
function initializeScheduler() {
    schedule.scheduleJob('0 0 * * 1-5', async () => { // 月~金の0時に投稿
        console.log('Bot is running to post papers');

        try {
            const query = 'Computer vision'; // 検索クエリ
            const botUserId = '6803c93270fbdf7e2ea0bcc7'; // ボットアカウントのユーザーID

            // 論文を検索
            const results = await searchScholar.searchPapers(query);

            for (const paper of results) {
                const newPost = new Post({
                    userId: botUserId,
                    desc: `${paper.title.toUpperCase()}\n\n${paper.abstract}`,
                    createdAt: new Date(),
                });

                await newPost.save();
            }

            console.log('Bot has posted papers successfully');
        } catch (error) {
            console.error('Error in bot task:', error);
        }
    });
}

module.exports = initializeScheduler;
