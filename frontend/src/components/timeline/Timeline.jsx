import React, { useEffect, useState, useContext } from 'react';
import "./Timeline.css";
import Shere from '../share/Share';
import Post from '../post/Post';
import LikedPostsList from '../likedPostsList/LikedPostsList';
import axios from 'axios';
import { AuthContext } from '../../states/AuthContext';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Timeline({ username, onMetadataSelect, showLikedPosts=false, openIds: propOpenIds, onToggle }) {
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
                        ? await axios.get(`/api/posts/profile/${username}?page=1`, { signal: controller.signal })
                        : showLikedPosts
                            ? await axios.get(`/api/posts/liked-posts/${user._id}?page=1`, { signal: controller.signal })
                            : await axios.get(`/api/posts/timeline/${user._id}?page=1`, { signal: controller.signal });
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
                    ? await axios.get(`/api/posts/profile/${username}?page=${nextPage}`)
                    : showLikedPosts
                        ? await axios.get(`/api/posts/liked-posts/${user._id}?page=${nextPage}`)
                        : await axios.get(`/api/posts/timeline/${user._id}?page=${nextPage}`);

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
            case 'comments':
                return [...posts].sort((a, b) => b.comments.length - a.comments.length);
            case 'createdAt':
            default:
                return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    useEffect(() => {
        const filterPosts = async () => {
            if (!posts.length) return;

            if (searchKeyword?.trim()) {
                const response = await axios.post(`/api/posts/search`, {
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

    // いいねリストページ用の一覧表示
    // userIdしかない場合のユーザー情報キャッシュ
    const [userCache, setUserCache] = useState({});

    useEffect(() => {
        if (!showLikedPosts || !filteredPosts.length) return;
        const idsToFetch = filteredPosts
            .filter(post => !post.username && post.userId && !userCache[post.userId])
            .map(post => post.userId);
        if (idsToFetch.length === 0) return;
        const fetchUsers = async () => {
            try {
                const promises = idsToFetch.map(id => axios.get(`/api/users?userId=${id}`));
                const results = await Promise.all(promises);
                const newCache = { ...userCache };
                idsToFetch.forEach((id, idx) => {
                    const userData = results[idx].data.user || results[idx].data;
                    newCache[id] = userData;
                });
                setUserCache(newCache);
            } catch (err) {
                // 失敗時は何もしない
            }
        };
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showLikedPosts, filteredPosts]);

    // openIdsは親から受け取る（なければ内部で管理）
    const [internalOpenIds, setInternalOpenIds] = useState([]);
    const openIds = propOpenIds !== undefined ? propOpenIds : internalOpenIds;

    const handleToggle = (id) => {
        if (onToggle) {
            onToggle(id);
        } else {
            setInternalOpenIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            );
        }
    };

    if (showLikedPosts) {
        return (
            <LikedPostsList
                filteredPosts={filteredPosts}
                openIds={openIds}
                handleToggle={handleToggle}
                onMetadataSelect={onMetadataSelect}
                userCache={userCache}
            />
        );
    }

    // 通常タイムライン表示
    return (
        <div className="timeline">
            <div className="timelineWrapper">
                {user && user.username === username && <Shere />}
                <div className="sortOptions">
                    <label>表示順： </label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="createdAt">投稿時間</option>
                        <option value="likes">❤数</option>
                        <option value="comments">コメント数</option>
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
                        <Post post={post} key={post._id} onMetadataSelect={onMetadataSelect} />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    );
}
