import React, { useEffect, useState } from "react";
import axios from "axios";
import InfiniteScroll from 'react-infinite-scroll-component';
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import RightBar from "../../components/rightbar/Rightbar";
import Post from '../../components/post/Post';
import "./LikedPosts.css";

function LikedPosts() {
    const [likedPosts, setLikedPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [sortOrder, setSortOrder] = useState('createdAt');

    useEffect(() => {
        const fetchLikedPosts = async () => {
            try {
                const userId = JSON.parse(localStorage.getItem("user"))._id;
                const response = await axios.get(`/posts/liked-posts/${userId}?page=1`);
                setLikedPosts(response.data);
                setPage(1);
                setHasMore(response.data.length > 0);
            } catch (error) {
                console.error("Error fetching liked posts:", error);
            }
        };

        fetchLikedPosts();
    }, []);

    const fetchMoreLikedPosts = async () => {
        const nextPage = page + 1;
        try {
            const userId = JSON.parse(localStorage.getItem("user"))._id;
            const response = await axios.get(`/posts/liked-posts/${userId}?page=${nextPage}`);
            if (response.data.length === 0) {
                setHasMore(false);
            } else {
                setLikedPosts((prevPosts) => [...prevPosts, ...response.data]);
                setPage(nextPage);
            }
        } catch (error) {
            console.error("Error fetching more liked posts:", error);
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

    return (
        <>
            <Topbar />
            <div className="likedPostsContainer">
                <Sidebar />
                <div className="likedPostsContent">
                    <div className="sortOptions">
                        <label>表示順： </label>
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                            <option value="createdAt">投稿時間</option>
                            <option value="likes">いいね数</option>
                            <option value="comments">コメント数</option>
                        </select>
                    </div>
                    <InfiniteScroll
                        dataLength={likedPosts.length}
                        next={fetchMoreLikedPosts}
                        hasMore={hasMore}
                        loader={<h4>Loading...</h4>}
                        endMessage={<h4>No more posts ...</h4>}
                    >
                        {sortPosts(likedPosts, sortOrder).map((post) => (
                            <Post post={post} key={post._id} />
                        ))}
                    </InfiniteScroll>
                </div>
                <RightBar />
            </div>
        </>
    );
}

export default LikedPosts;
