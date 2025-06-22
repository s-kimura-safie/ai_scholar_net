import React, { useState, useEffect, useContext } from 'react'
import { MoreVert } from '@mui/icons-material';
import { Menu, MenuItem, Modal, Box, TextField, Button } from '@mui/material';
import { format } from 'timeago.js';
import axios from 'axios'
import CommentBar from "../commentbar/CommentBar";
import './Post.css'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';


export default function Post({ post, onMetadataSelect }) {

    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const { user: loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用

    const [like, setLike] = useState((post.likes || []).length);
    const [numComments, setNumComments] = useState((post.comments || []).length);
    const [heartImgPath, setPath] = useState(PUBLIC_FOLDER + "/icons/heart_off.png");
    const [isLiked, setIsLiked] = useState(false);
    const [postUser, setUser] = useState({});
    const [selectedPostId, setSelectedPostId] = useState(null); // コメント表示用のPostID

    // ユーザー情報取得
    useEffect(() => {
        const controller = new AbortController(); // AbortController を作成

        const fetchUser = async () => {
            try {
                const response = await axios.get(`/api/users?userId=${post.userId}`, {
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
        setNumComments((post.comments || []).length);
    }, [post.comments]);

    // コメントを表示する投稿のIDを設定
    const handleCommentClick = () => {
        setSelectedPostId(post._id); // コメント表示用にPost IDを設定
    };

    // 投稿の❤数を更新する関数
    const handleLike = async () => {
        // loginUserがnullの場合は処理をスキップ
        if (!loginUser) return;

        try {
            await axios.put(`/api/posts/${post._id}/like`, // request URL: ❤を押す投稿のID
                { userId: loginUser._id } // request body: ❤を押すユーザーのID
            );
        }
        catch (err) {
            console.log(err);
        }

        // ❤数を更新
        setLike((prev) => prev + (isLiked ? -1 : 1)); // prevで前の❤数を参照し、isLikeに応じて増減させる
    }

    // 投稿の❤の状態を更新
    useEffect(() => {
        // loginUserがnullの場合は処理をスキップ
        if (!loginUser) return;

        const checkLikeStatus = async () => {
            try {
                const response = await axios.get(`/api/posts/${post._id}/likes`, { params: { userId: loginUser._id } });
                setIsLiked(response.data.includes(loginUser._id));
                setPath(response.data.includes(loginUser._id) ? PUBLIC_FOLDER + "/icons/heart.png" : PUBLIC_FOLDER + "/icons/heart_off.png");
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
        // loginUserがnullの場合は処理をスキップ
        if (!loginUser) return;

        try {
            await axios.delete(`/api/posts/${post._id}`, { data: { userId: loginUser._id } });
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
        // loginUserがnullの場合は処理をスキップ
        if (!loginUser) return;

        if (newDesc) {
            try {
                await axios.put(`/api/posts/${post._id}`, {
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

    const handleViewDetails = async () => {
        if (!post.paperId) {
            console.error("No paperId associated with this post.");
            return;
        }

        try {
            const response = await axios.get(`/api/scholar/${post.paperId}/metadata`);
            onMetadataSelect(response.data); // 親コンポーネントにmetadataを渡す
        } catch (err) {
            alert("論文の詳細データが見つかりませんでした。");
            console.error("Error fetching paper metadata:", err);
        }
    };

    return (
        <div className="post">
            <div className="postWrapper">
                <div className="postTop">
                    <div className="postTopLeft">
                        <Link to={`/profile/${postUser.username}`}>
                            <img src={postUser.profilePicture
                                ? PUBLIC_FOLDER + "/profile/" + postUser.profilePicture
                                : PUBLIC_FOLDER + "/profile/noAvatar.png"}
                                alt="" loading="lazy" className="postProfileImg" />
                        </Link>
                        <span className="postUsername">{postUser.username}</span>
                        <span className="postDate">{format(post.createdAt)}</span>
                    </div>
                    <div className="postTopRight">
                        {loginUser && loginUser._id === post.userId && (
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
                    <span className="postText">{post.desc}</span>
                    <img src={PUBLIC_FOLDER + "/post/" + post.img} alt="" className="postImg" />
                </div>
                <div className="postBottom">
                    <div className="postBottomLeft">
                        {post.paperId && (
                            <button className="detailButton" onClick={handleViewDetails}>詳細を見る ▶</button>
                        )}
                    </div>

                    <div className="postBottomRight">
                        <div className="reactionItem">
                            <img src={heartImgPath} alt="" className="icon" onClick={() => handleLike()} />
                            <span className="counter"> {like}</span>

                        </div>
                        <div className="reactionItem">
                            <img src={PUBLIC_FOLDER + "/icons/comment.png"} alt="" className="icon" onClick={() => handleCommentClick()} />
                            <span className="counter">{numComments} </span>
                        </div>
                    </div>
                </div>
            </div>

            {selectedPostId && loginUser && (
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
