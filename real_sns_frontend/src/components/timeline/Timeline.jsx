import React, { useEffect, useState, useContext } from 'react'
import "./Timeline.css"
import Shere from '../share/Share'
import Post from '../post/Post'
import axios from 'axios'
import { AuthContext } from '../../states/AuthContext'

export default function Timeline({ username }) {
    const [posts, setPosts] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchPosts = async () => {
            const response = username
                ? await axios.get(`/posts/profile/${username}`)
                : await axios.get(`/posts/timeline/${user._id}`);
            setPosts(
                response.data.sort((post1, post2) => {
                    return new Date(post2.createdAt) - new Date(post1.createdAt);
                })
            );
        };
        fetchPosts();
    }, [username, user._id]) // usernameが変更されたら再レンダリング


    return (
        <div className="timeline">

            <div className="timelineWrapper">
                <Shere />
                {posts.map((post) => (
                    <Post post={post} key={post._id} />
                ))}

            </div>
        </div>
    )
}
