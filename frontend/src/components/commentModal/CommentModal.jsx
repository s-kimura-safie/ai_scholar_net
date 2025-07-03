import React, { useState, useEffect, useContext } from 'react';
import './CommentModal.css';
import { Close } from '@mui/icons-material';
import { AuthContext } from '../../states/AuthContext';
import axios from 'axios';
import { format } from 'timeago.js';

export default function CommentModal({ isOpen, onClose }) {
    const { user } = useContext(AuthContext);
    const [commentPosts, setCommentPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userCache, setUserCache] = useState({}); // ユーザー情報をキャッシュ
    const [replyTexts, setReplyTexts] = useState({}); // 各投稿の返信テキスト
    const [submitting, setSubmitting] = useState({}); // 送信中の状態管理
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    useEffect(() => {
        if (isOpen && user) {
            fetchCommentPosts();
        }
    }, [isOpen, user]);

    const fetchCommentPosts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/posts/comments/user/${user._id}`);

            // 各投稿のユーザー情報を取得
            const postsWithUserInfo = await Promise.all(
                response.data.map(async (post) => {
                    const postUser = await fetchUserInfo(post.userId);
                    return {
                        ...post,
                        userInfo: postUser
                    };
                })
            );

            setCommentPosts(postsWithUserInfo);
        } catch (error) {
            console.error('コメント関連の投稿の取得に失敗しました:', error);
        } finally {
            setLoading(false);
        }
    };

    // ユーザー情報を取得する関数（キャッシュ機能付き）
    const fetchUserInfo = async (userId) => {
        if (userCache[userId]) {
            return userCache[userId];
        }

        try {
            const response = await axios.get(`/api/users?userId=${userId}`);
            const userData = response.data;
            setUserCache(prev => ({ ...prev, [userId]: userData }));
            return userData;
        } catch (error) {
            console.error('ユーザー情報の取得に失敗しました:', error);
            return { username: 'Unknown User', profilePicture: null };
        }
    };

    // コメントを投稿する関数
    const handleSubmitComment = async (postId) => {
        const commentText = replyTexts[postId];
        if (!commentText || !commentText.trim()) {
            return;
        }

        setSubmitting(prev => ({ ...prev, [postId]: true }));

        try {
            const response = await axios.put(`/api/posts/${postId}/comment`, {
                userId: user._id,
                username: user.username,
                text: commentText.trim()
            });

            // コメント投稿成功後、投稿リストを更新
            setCommentPosts(prev =>
                prev.map(post =>
                    post._id === postId
                        ? {
                            ...post,
                            comments: [...post.comments, {
                                userId: user._id,
                                username: user.username,
                                text: commentText.trim(),
                                profilePicture: user.profilePicture
                            }]
                        }
                        : post
                )
            );

            // 返信テキストをクリア
            setReplyTexts(prev => ({ ...prev, [postId]: '' }));

        } catch (error) {
            console.error('コメントの投稿に失敗しました:', error);
        } finally {
            setSubmitting(prev => ({ ...prev, [postId]: false }));
        }
    };

    // 返信テキストの変更ハンドラ
    const handleReplyTextChange = (postId, text) => {
        setReplyTexts(prev => ({ ...prev, [postId]: text }));
    };

    const renderPost = (post) => {
        const postUserId = post.userId;
        const postUser = post.userInfo || { username: 'Unknown User', profilePicture: null };

        const isUserPost = postUserId === user._id;
        const userHasCommented = post.comments.some(comment => comment.userId === user._id);

        return (
            <div key={post._id} className="commentModalPost">
                <div className="commentModalPostHeader">
                    <img
                        src={postUser.profilePicture
                            ? `${PUBLIC_FOLDER}/profile/${postUser.profilePicture}`
                            : `${PUBLIC_FOLDER}/profile/noAvatar.png`}
                        alt=""
                        className="commentModalPostAvatar"
                    />
                    <div className="commentModalPostInfo">
                        <span className="commentModalPostUsername">{postUser.username}</span>
                        <span className="commentModalPostDate">{format(post.createdAt)}</span>
                    </div>
                </div>

                <div className="commentModalPostContent">
                    <p>{post.desc.length > 100 ? `${post.desc.slice(0, 100)}...` : post.desc}</p>
                </div>

                <div className="commentModalComments">
                    {isUserPost ? (
                        <div className="commentModalSection">
                            <h4>あなたの投稿へのコメント</h4>
                            {post.comments.map((comment, index) => (
                                <div key={index} className="commentModalComment">
                                    <img
                                        src={comment.profilePicture
                                            ? `${PUBLIC_FOLDER}/profile/${comment.profilePicture}`
                                            : `${PUBLIC_FOLDER}/profile/noAvatar.png`}
                                        alt=""
                                        className="commentModalCommentAvatar"
                                    />
                                    <div className="commentModalCommentContent">
                                        <span className="commentModalCommentUsername">
                                            {comment.username}
                                            {comment.userId === user._id && " (あなた)"}
                                        </span>
                                        <span className="commentModalCommentText">{comment.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : userHasCommented ? (
                        <div className="commentModalSection">
                            <h4>投稿へのコメント</h4>
                            {post.comments.map((comment, index) => (
                                <div key={index} className="commentModalComment">
                                    <img
                                        src={comment.profilePicture
                                            ? `${PUBLIC_FOLDER}/profile/${comment.profilePicture}`
                                            : `${PUBLIC_FOLDER}/profile/noAvatar.png`}
                                        alt=""
                                        className="commentModalCommentAvatar"
                                    />
                                    <div className="commentModalCommentContent">
                                        <span className="commentModalCommentUsername">
                                            {comment.username}
                                            {comment.userId === user._id && " (あなた)"}
                                        </span>
                                        <span className="commentModalCommentText">{comment.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {/* 返信フォーム */}
                    <div className="commentModalReplyForm">
                        <div className="commentModalReplyInput">
                            <img
                                src={user.profilePicture
                                    ? `${PUBLIC_FOLDER}/profile/${user.profilePicture}`
                                    : `${PUBLIC_FOLDER}/profile/noAvatar.png`}
                                alt=""
                                className="commentModalReplyAvatar"
                            />
                            <input
                                type="text"
                                placeholder="コメントを入力..."
                                value={replyTexts[post._id] || ''}
                                onChange={(e) => handleReplyTextChange(post._id, e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !submitting[post._id]) {
                                        handleSubmitComment(post._id);
                                    }
                                }}
                                className="commentModalReplyTextInput"
                                disabled={submitting[post._id]}
                            />
                            <button
                                onClick={() => handleSubmitComment(post._id)}
                                disabled={!replyTexts[post._id]?.trim() || submitting[post._id]}
                                className="commentModalReplyButton"
                            >
                                {submitting[post._id] ? '送信中...' : '送信'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="commentModalOverlay" onClick={onClose}>
            <div className="commentModalContent" onClick={(e) => e.stopPropagation()}>
                <div className="commentModalHeader">
                    <h2>あなたがコメントした投稿</h2>
                    <Close className="commentModalClose" onClick={onClose} />
                </div>

                <div className="commentModalBody">
                    {loading ? (
                        <div className="commentModalLoading">読み込み中...</div>
                    ) : commentPosts.length === 0 ? (
                        <div className="commentModalEmpty">コメント関連の投稿がありません</div>
                    ) : (
                        <div className="commentModalPosts">
                            {commentPosts.map(renderPost)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
