import React from 'react';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Post from '../post/Post';
import './LikedPostsList.css';

export default function LikedPostsList({ filteredPosts, openIds, handleToggle, onMetadataSelect, userCache }) {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER || "/";

    function extractTitle(desc) {
        if (!desc) return "(タイトルなし)";
        const titleMatch = desc.match(/タイトル[:：]\s*(.*)/);
        if (titleMatch) return titleMatch[1];
        const titleEnMatch = desc.match(/Title[:：]\s*(.*)/i);
        if (titleEnMatch) return titleEnMatch[1];
        return "(タイトルなし)";
    }

    return (
        <div className="timeline">
            <div className="timelineWrapper">
                <h2>いいねした投稿一覧</h2>
                <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                    {filteredPosts.length === 0 ? (
                        <li>いいねした投稿はありません。</li>
                    ) : (
                        filteredPosts.map((post) => {
                            let profilePicture = post.profilePicture || post.user?.profilePicture || post.userInfo?.profilePicture;
                            let username = post.username || post.user?.username || post.userInfo?.username;
                            // userIdしかない場合はキャッシュから取得
                            if (!username && post.userId && userCache[post.userId]) {
                                username = userCache[post.userId].username;
                                profilePicture = userCache[post.userId].profilePicture;
                            }
                            return (
                                <li key={post._id} className="likedPostItem">
                                    <div className="likedPostHeader">
                                        <img
                                            src={profilePicture ? `${PUBLIC_FOLDER}/profile/${profilePicture}` : `${PUBLIC_FOLDER}/profile/noAvatar.png`}
                                            alt="プロフィール"
                                            className="likedPostAvatar"
                                        />
                                        <span className="likedPostAuthor">{username || post.userId}</span>
                                        {extractTitle(post.desc) !== "(タイトルなし)" && (
                                            <span className="likedPostTitle">{extractTitle(post.desc)}</span>
                                        )}
                                        <button className="toggleContentBtn" onClick={() => handleToggle(post._id)}>
                                            {openIds.includes(post._id) ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                    </div>
                                    {openIds.includes(post._id) && (
                                        <div className="likedPostContent">
                                            <Post post={post} onMetadataSelect={onMetadataSelect} />
                                        </div>
                                    )}
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        </div>
    );
}
