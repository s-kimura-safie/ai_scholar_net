import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CommentBar.css";

export default function CommentBar({ postId, loginUser, setSelectedPostId, setNumComments }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [isExpanded, setIsExpanded] = useState(false); // 初期状態を false に変更
    const [isVisible, setIsVisible] = useState(true); // 表示状態を管理

    // コンポーネントがマウントされたときにアニメーションを開始
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExpanded(true);
        }, 50); // 少し遅延を入れてアニメーションが見えるようにする

        return () => clearTimeout(timer);
    }, []);

    // コメント一覧を取得
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await axios.get(`/api/posts/${postId}/comments`);
                setComments(response.data);
            } catch (err) {
                console.error("Failed to fetch comments:", err);
            }
        };

        fetchComments();
    }, [postId]);

    // 新しいコメントを追加
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            const response = await axios.put(`/api/posts/${postId}/comment`, {
                userId: loginUser._id,
                username: loginUser.username,
                text: newComment,
            });
            const addedComment = {
                ...response.data,
                profilePicture: loginUser.profilePicture
            };
            setComments((prev) => [...prev, addedComment]); // ローカル状態を更新
            setNumComments((prev) => prev + 1);
            setNewComment("");
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    // コメントセクションを閉じる
    const handleCommentClose = () => {
        setIsExpanded(false); // 折りたたみ状態にする
        setTimeout(() => {
            setIsVisible(false); // アニメーション完了後に非表示
            setSelectedPostId(null); // 親コンポーネントの状態を更新
        }, 500); // アニメーションの時間に合わせる
    };

    // コンポーネントが非表示の場合は何も表示しない
    if (!isVisible) return null;

    return (
        <div className={`commentSection ${isExpanded ? "expanded" : "collapsed"}`}>
            <h4>コメント</h4>
            <div className="commentsList">
                {comments.map((comment, index) => (
                    <div key={comment._id || index} className="commentItem">
                        <img
                            src={comment.profilePicture ?
                                (comment.profilePicture.startsWith('http') ?
                                    comment.profilePicture :
                                    `/images/profile/${comment.profilePicture.split('/').pop()}`
                                ) :
                                "/images/profile/noAvatar.png"
                            }
                            alt={comment.username}
                            className="commentUserAvatar"
                        />
                        <div className="commentContent">
                            <strong>{comment.username}</strong> : {comment.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="addComment">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && newComment.trim()) {
                            handleAddComment();
                        }
                    }}
                    placeholder="コメントを入力..."
                    className="commentInput"
                />
                <button
                    onClick={handleAddComment}
                    className="commentButton"
                    disabled={!newComment.trim()}
                >
                    送信
                </button>
                <button onClick={handleCommentClose} className="commentCloseButton">閉じる</button>
            </div>
            <div className="commentTemplates">
                {['おもしろい！', '興味深い！', '参考になる！', '読んでみたい！'].map((template, index) => (
                    <button
                        key={index}
                        className="templateButton"
                        onClick={() => setNewComment(template)}
                    >
                        {template}
                    </button>
                ))}
            </div>
        </div>
    );
}
