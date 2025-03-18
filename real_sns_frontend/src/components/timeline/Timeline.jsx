import React, { useEffect, useState, useContext } from 'react'
import "./Timeline.css"
import Shere from '../share/Share'
import Post from '../post/Post'
import axios from 'axios'
import { AuthContext } from '../../states/AuthContext'
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Timeline({ username }) {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1); // 現在のページ番号
    const [hasMore, setHasMore] = useState(true); // さらに投稿があるかどうか
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchPosts = async () => {
            const response = username
                ? await axios.get(`/posts/profile/${username}?page=1`)
                : await axios.get(`/posts/timeline/${user._id}?page=1`);
            setPosts(
                response.data.sort((post1, post2) => {
                    return new Date(post2.createdAt) - new Date(post1.createdAt);
                })
            );
            setHasMore(response.data.length > 0); // 初回取得で投稿があるか確認
        };
        fetchPosts();
    }, [username]);

    const fetchMorePosts = async () => {
        const nextPage = page + 1;
        const response = username
            ? await axios.get(`/posts/profile/${username}?page=${nextPage}`)
            : await axios.get(`/posts/timeline/${user._id}?page=${nextPage}`);

        console.log(response.data); // APIレスポンスを確認

        if (response.data.length === 0) {
            setHasMore(false); // 追加の投稿がない場合
        } else {
            setPosts((prevPosts) => [
                ...prevPosts,
                ...response.data.filter(
                    (newPost) => !prevPosts.some((post) => post._id === newPost._id)
                ), // 重複を排除
            ]);
            setPage(nextPage); // ページ番号を更新
        }
    };

    return (
        <div className="timeline">
            <div className="timelineWrapper">
                <Shere />
                <InfiniteScroll
                    dataLength={posts.length}
                    next={fetchMorePosts} // 次の投稿を取得する関数
                    hasMore={hasMore} // 取得可能な投稿があるかどうか
                    loader={<h4>Loading...</h4>}
                    endMessage={<h4>No more posts to show</h4>} // 全件読み込み完了時のメッセージ
                >
                    {posts.map((post) => (
                        <Post post={post} key={post._id} />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    );
}
