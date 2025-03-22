import React, { useEffect, useState, useContext } from 'react'
import "./Timeline.css"
import Shere from '../share/Share'
import Post from '../post/Post'
import axios from 'axios'
import { AuthContext } from '../../states/AuthContext'
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Timeline({ username }) {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [page, setPage] = useState(1); // 現在のページ番号
    const [hasMore, setHasMore] = useState(true); // さらに投稿があるかどうか
    const { user, searchKeyword } = useContext(AuthContext);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = username
                    ? await axios.get(`/posts/profile/${username}?page=1`)
                    : await axios.get(`/posts/timeline/${user._id}?page=1`);
                const sortedPosts = response.data.sort((post1, post2) => {
                    return new Date(post2.createdAt) - new Date(post1.createdAt);
                });
                setPosts(sortedPosts);
                setHasMore(response.data.length > 0); // 初回取得で投稿があるか確認
            } catch (err) {
                console.error(err);
            }
        }
        fetchPosts();
    }, [username, user._id]);

    // 検索キーワードが変更されたときに投稿をフィルタリング
    useEffect(() => {
        const filterPosts = async () => {
            if (searchKeyword?.trim()) {
                // 検索キーワードがある場合、フィルタリングされた投稿を取得
                const response = await axios.post(`/posts/search`, {
                    keyword: searchKeyword,
                    posts: posts
                });
                setFilteredPosts(response.data); // フィルタリングされた投稿を設定
            } else {
                // 検索キーワードがない場合、全投稿を表示
                setFilteredPosts(posts);
            }
        };

        filterPosts(); // 非同期関数を呼び出す
    }, [searchKeyword, posts]);

    // 追加の投稿を取得
    const fetchMorePosts = async () => {
        const nextPage = page + 1;

        try {
            const response = username
                ? await axios.get(`/posts/profile/${username}?page=${nextPage}`)
                : await axios.get(`/posts/timeline/${user._id}?page=${nextPage}`);

            if (response.data.length === 0) {
                setHasMore(false); // 追加の投稿がない場合
            } else {
                const newPosts = response.data.filter(
                    (newPost) => !posts.some((post) => post._id === newPost._id)
                ); // 重複を排除
                setPosts((prevPosts) => [...prevPosts, ...newPosts]);
                setPage(nextPage); // ページ番号を更新
            }
        } catch (err) {
            console.error(err);
        }

    };

    return (
        <div className="timeline">
            <div className="timelineWrapper">
                {user.username === username && <Shere />}
                <InfiniteScroll
                    dataLength={filteredPosts.length}
                    next={fetchMorePosts}
                    hasMore={hasMore} // 取得可能な投稿があるかどうか
                    loader={<h4>Loading...</h4>}
                    endMessage={<h4>No more posts to show</h4>} // 全件読み込み完了時のメッセージ
                >
                    {filteredPosts.map((post) => (
                        <Post post={post} key={post._id} />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    );
}
