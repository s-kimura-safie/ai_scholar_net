import React from 'react'
import "./Share.css"
import { Image, Gif, Face, Analytics } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import { useContext, useRef, useState } from 'react';
import axios from 'axios';


export default function Share() {
    const { user } = useContext(AuthContext);
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    const desc = useRef();
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); // ページ遷移を防ぐ
        const newPost = {
            userId: user._id,
            desc: desc.current.value
        };

        if (file) {
            const data = new FormData(); // ファイルを送信するためのFormDataオブジェクトを作成
            const fileName = Date.now() + "_" + file.name;
            data.append("name", fileName);
            data.append("file", file);
            newPost.img = fileName; // 画像ファイル名をnewPostに追加

            // 画像をアップロード
            try {
                await axios.post("/upload", data);
            }
            catch (err) {
                console.log(err);
            }
        }

        try {
            await axios.post("/posts", newPost);
            window.location.reload();
        }
        catch (err) {
            console.log(err);
        }
    }

    return (
        <div className="share">
            <div className="shareWrapper">
                <div className="shareTop">
                    <Link to={`/profile/${user.username}`}>
                        <img src={PUBLIC_FOLDER + user.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"} alt="" className="shareProfileImg" />
                    </Link>
                    <textarea
                        className="shareInput"
                        placeholder="なんばしよると？"
                        ref={desc}
                    ></textarea>
                </div>
                <hr className="shareHr" />
            </div>

            <form className="shareButtons" onSubmit={(e) => handleSubmit(e)}>
                <div className="shareOptions">
                    <label className="shareOption" htmlFor="file">
                        <Image className="shareIcon" htmlColor="blue" />
                        <span className="shareOptionText">写真</span>
                        <input type="file" id="file" accept=".png, .jpg, .jpeg" style={{ display: "none" }}
                            onChange={(e) => setFile(e.target.files[0])} />
                    </label>
                    {/*
                    <div className="shareOption">
                        <Gif className="shareIcon" htmlColor="hotpink" />
                        <span className="shareOptionText">GIF</span>
                    </div>
                    <div className="shareOption">
                        <Face className="shareIcon" htmlColor="green" />
                        <span className="shareOptionText">気持ち</span>
                    </div>
                    <div className="shareOption">
                        <Analytics className="shareIcon" htmlColor="red" />
                        <span className="shareOptionText">投票</span>
                    </div>
*/}
                    <div>
                        {file && <p>{file.name}</p>}
                    </div>
                </div>
                <button className="shareButton" type="submit">投稿</button>

            </form>
        </div>
    )
}
