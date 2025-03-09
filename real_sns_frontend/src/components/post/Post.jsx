import React, { useState, useEffect, useContext } from 'react'
import { MoreVert } from '@mui/icons-material';
import { format } from 'timeago.js';
import axios from 'axios'
import './Post.css'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';


const Post = (props) => {
    const { post } = props;

    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const { user:loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用

    const [like, setLike] = useState(post.likes.length);
    const [heartImgPath, setPath] = useState(PUBLIC_FOLDER + "/heart_off.png");
    const [isLiked, setIsLiked] = useState(false);
    const [postUser, setUser] = useState({});

    useEffect(() => {
        const fetchUser = async () => {
            const response = await axios.get(`/users?userId=${post.userId}`);
            // console.log(`Response: ${response}`);
            setUser(response.data);
        }
        fetchUser();
    }, [post]); // postが変更されたら再レンダリング

    const handleLike = async () => {
        try {
            await axios.put(`/posts/${post._id}/like`, // request URL: いいねを押す投稿のID
                { userId: loginUser._id } // request body: いいねを押すユーザーのID
            );
        }
        catch (err) {
            console.log(err);
        }

        if (isLiked) {
            setLike(like - 1);
            setPath(PUBLIC_FOLDER + "/heart_off.png");
        } else {
            setLike(like + 1);
            setPath(PUBLIC_FOLDER + "/heart.png");
        }
        setIsLiked(!isLiked);
    }

    return (
        <div className="post">
            <div className="postWrapper">
                <div className="postTop">
                    <div className="postTopLeft">
                        <Link to={`/profile/${postUser.username}`}>
                            <img src={PUBLIC_FOLDER + postUser.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"} alt="" className="postProfileImg" />
                        </Link>
                        <span className="postUsername">{postUser.username}</span>
                        <span className="postDate">{format(post.createdAt)}</span>
                    </div>
                    <div className="postTopRight">
                        <MoreVert />
                    </div>
                </div>
                <div className="postCenter">
                    <span className="postText">{post.desc}</span>
                    <img src={PUBLIC_FOLDER + post.img} alt="" className="postImg" />
                </div>
                <div className="postBottom">
                    <div className="postBottomLeft">
                        <img src={heartImgPath} alt="" className="likeIcon" onClick={() => handleLike()} />
                        <span className="postLikeCounter">{like}人がいいねを押しました。</span>
                    </div>
                    <div className="postBottomRight">
                        <span className="postCommentText">{post.comment}: comments</span>
                    </div>
                </div>

            </div>

        </div>
    )
}

export default Post
