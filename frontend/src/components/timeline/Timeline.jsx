import React, { useEffect, useState, useContext } from 'react';
import "./Timeline.css";
import Shere from '../share/Share';
import Post from '../post/Post';
import axios from 'axios';
import { AuthContext } from '../../states/AuthContext';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Timeline({ username }) {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [sortOrder, setSortOrder] = useState('createdAt'); // ソート順
    const { user, searchKeyword } = useContext(AuthContext);

    useEffect(() => {
        if (!user) return;

        const controller = new AbortController();

        const fetchPosts = async () => {
            try {
                setPosts([]);
                setFilteredPosts([]);
                const response = username
                    ? await axios.get(`/posts/profile/${username}?page=1`, { signal: controller.signal })
                    : await axios.get(`/posts/timeline/${user._id}?page=1`, { signal: controller.signal });
                const sortedPosts = sortPosts(response.data, sortOrder);
                setPosts(sortedPosts);
                setFilteredPosts(sortedPosts);
                setPage(1);
                setHasMore(response.data.length > 0);
            } catch (err) {
                if (axios.isCancel(err)) {
                    console.log("Request canceled");
                } else {
                    console.error(err);
                }
            }
        };
        fetchPosts();

        return () => {
            controller.abort();
        };

    }, [username, user, sortOrder]);

    // 追加の投稿を取得
    const fetchMorePosts = async () => {
        if (!user) return;

        const nextPage = page + 1;

        try {
            const response = username
                ? await axios.get(`/posts/profile/${username}?page=${nextPage}`)
                : await axios.get(`/posts/timeline/${user._id}?page=${nextPage}`);

            if (response.data.length === 0) {
                setHasMore(false);
            } else {
                const newPosts = response.data.filter(
                    (newPost) => !posts.some((post) => post._id === newPost._id)
                );
                const updatedPosts = sortPosts([...posts, ...newPosts], sortOrder);
                setPosts(updatedPosts);
                setPage(nextPage);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const sortPosts = (posts, order) => {
        switch (order) {
            case 'likes':
                return [...posts].sort((a, b) => b.likes.length - a.likes.length);
            case 'createdAt':
            default:
                return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    useEffect(() => {
        const filterPosts = async () => {
            if (!posts.length) return;

            if (searchKeyword?.trim()) {
                const response = await axios.post(`/posts/search`, {
                    keyword: searchKeyword,
                    posts: posts
                });
                setFilteredPosts(sortPosts(response.data, sortOrder));
            } else {
                setFilteredPosts(sortPosts(posts, sortOrder));
            }
        };

        filterPosts();
    }, [searchKeyword, posts, sortOrder]);

    return (
        <div className="timeline">
            <div className="timelineWrapper">
                {user && user.username === username && <Shere />}
                <div className="sortOptions">
                    <label>表示順： </label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="createdAt">投稿時間</option>
                        <option value="likes">いいね数</option>
                    </select>
                </div>
                <InfiniteScroll
                    dataLength={filteredPosts.length}
                    next={fetchMorePosts}
                    hasMore={hasMore}
                    loader={<h4>Loading...</h4>}
                    endMessage={<h4>No more posts ...</h4>}
                >
                    {filteredPosts.map((post) => (
                        <Post post={post} key={post._id} />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    );
}
