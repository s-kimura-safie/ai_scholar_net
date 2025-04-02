import React, { useState, useEffect, useContext } from 'react'
import { MoreVert } from '@mui/icons-material';
import { Menu, MenuItem, Modal, Box, TextField, Button } from '@mui/material';
import { format } from 'timeago.js';
import axios from 'axios'
import CommentBar from "../commentbar/CommentBar";
import './Post.css'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';


export default function Post({ post }) {

    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const { user: loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用

    const [like, setLike] = useState(post.likes.length);
    const [heartImgPath, setPath] = useState(PUBLIC_FOLDER + "/heart_off.png");
    const [numComments, setNumComments] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [postUser, setUser] = useState({});
    const [selectedPostId, setSelectedPostId] = useState(null); // コメント表示用のPostID

    // ユーザー情報取得
    useEffect(() => {
        const controller = new AbortController(); // AbortController を作成

        const fetchUser = async () => {
            try {
                const response = await axios.get(`/users?userId=${post.userId}`, {
                    signal: controller.signal, // AbortController の signal を設定
                });
                setUser(response.data);
            } catch (err) {
                if (axios.isCancel(err)) { // リクエストがキャンセルされた場合
                    console.log("Request canceled");
                } else {
                    console.error("Error fetching user data:", err);
                }
            }
        };

        fetchUser();

        return () => {
            controller.abort(); // リクエストを中断するクリーンアップ関数を返す
        };
    }, [post]);

    // コメント数を更新
    useEffect(() => {
        setNumComments(post.comments.length);
    }, [post.comments]);

    // コメントを表示する投稿のIDを設定
    const handleCommentClick = () => {
        setSelectedPostId(post._id); // コメント表示用にPost IDを設定
    };

    // 投稿のいいね数を更新する関数
    const handleLike = async () => {
        try {
            await axios.put(`/posts/${post._id}/like`, // request URL: いいねを押す投稿のID
                { userId: loginUser._id } // request body: いいねを押すユーザーのID
            );
        }
        catch (err) {
            console.log(err);
        }

        // いいね数を更新
        setLike((prev) => prev + (isLiked ? -1 : 1)); // prevで前のいいね数を参照し、isLikeに応じて増減させる
    }

    // 投稿のいいねの状態を更新
    useEffect(() => {
        const checkLikeStatus = async () => {
            try {
                const response = await axios.get(`/posts/${post._id}/likes`, { params: { userId: loginUser._id } });
                setIsLiked(response.data.includes(loginUser._id));
                setPath(response.data.includes(loginUser._id) ? PUBLIC_FOLDER + "/heart.png" : PUBLIC_FOLDER + "/heart_off.png");
            } catch (err) {
                console.error("Error fetching like status:", err);
            }
        };

        checkLikeStatus();
    }, [like, loginUser, post._id, PUBLIC_FOLDER]);

    // 投稿の編集・削除機能
    const [anchorEl, setAnchorEl] = useState(null);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [newDesc, setNewDesc] = useState(post.desc);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget); // クリックした要素(MoreVert)の位置を取得
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/posts/${post._id}`, { data: { userId: loginUser._id } });
            window.location.reload();
        } catch (err) {
            console.log(err);
        }
        handleMenuClose();
    };

    const handleEditOpen = () => {
        setOpenEditModal(true);
        handleMenuClose();
    };

    const handleEditClose = () => {
        setOpenEditModal(false);
    };

    const editPost = async () => {
        if (newDesc) {
            try {
                await axios.put(`/posts/${post._id}`, {
                    userId: loginUser._id,
                    desc: newDesc
                });
                window.location.reload();
            } catch (err) {
                console.log(err);
            }
        }
        handleEditClose();
    };

    return (
        <div className="post">
            <div className="postWrapper">
                <div className="postTop">
                    <div className="postTopLeft">
                        <Link to={`/profile/${postUser.username}`}>
                            <img src={PUBLIC_FOLDER + postUser.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"} alt="" loading="lazy" className="postProfileImg" />
                        </Link>
                        <span className="postUsername">{postUser.username}</span>
                        <span className="postDate">{format(post.createdAt)}</span>
                    </div>
                    <div className="postTopRight">
                        {loginUser._id === post.userId && (
                            <>
                                <MoreVert onClick={handleMenuOpen} />
                                <Menu anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={handleEditOpen}>編集</MenuItem>
                                    <MenuItem onClick={handleDelete} sx={{ color: "red" }}>削除</MenuItem>
                                </Menu>
                            </>
                        )}
                    </div>
                </div>
                <div className="postCenter">
                    <span className="postText" style={{ whiteSpace: 'pre-line' }}>{post.desc}</span>
                    <img src={PUBLIC_FOLDER + post.img} alt="" className="postImg" />
                </div>
                <div className="postBottom">
                    <div className="postBottomLeft">
                        <img src={heartImgPath} alt="" className="likeIcon" onClick={() => handleLike()} />
                        <span className="postLikeCounter">{like}人がいいねを押しました。</span>
                    </div>
                    <div className="postBottomRight">
                        <span onClick={handleCommentClick} className="postCommentText">{numComments}:件のコメント</span>
                    </div>
                </div>
            </div>

            {selectedPostId && (
                <CommentBar postId={selectedPostId} loginUser={loginUser} setSelectedPostId={setSelectedPostId} setNumComments={setNumComments} />
            )}

            <Modal open={openEditModal} onClose={handleEditClose}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4
                }}>
                    <h2>投稿を編集</h2>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <Button variant="contained" color="primary" onClick={editPost} sx={{ mt: 2 }}>
                        保存
                    </Button>
                </Box>
            </Modal>
        </div>
    )
}
