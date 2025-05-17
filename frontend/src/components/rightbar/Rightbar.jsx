import React from 'react'
import "./Rightbar.css"
// import Online from '../online/Online'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';


export default function Rightbar({ user, metadata }) {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const [showMetadata, setShowMetadata] = useState(!!metadata);

    useEffect(() => {
        setShowMetadata(!!metadata);
    }, [metadata]);

    const HomeRightbar = () => {
        return (
            <>
                <div >
                    <p className="promotionTitle">プロモーション広告</p>
                    <a href="https://safie.co.jp/" target="_blank" rel="noopener noreferrer">
                        <img src={PUBLIC_FOLDER + "/promotion/safie_logo2.png"} alt="" className="promotionSafieImg" />
                    </a>
                    <p className="promotionName">セーフィー株式会社</p>
                    <a href="https://www.notion.so/safie/31292149a5f84e59be3ffb70ba71ce47" target="_blank" rel="noopener noreferrer">
                        <img src={PUBLIC_FOLDER + "/promotion/AIV_doraemon.png"} alt="" className="promotionAivImg" />
                    </a>
                    <p className="promotionName">AI Vision</p>
                    {/* <img src={PUBLIC_FOLDER + "/promotion/promotion3.jpeg"} alt="" className="promotionImg" /> */}
                    {/* <p className="promotionName">Shunsuuuuuu .inc</p> */}
                </div>
            </>
        );
    }

    const ProfileRightbar = () => {
        const [friends, setFriends] = useState([]);

        // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
        useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
            const fetchFriends = async () => {
                if (user.followings) {
                    const friendList = await Promise.all(
                        user.followings.map(async (userId) => {
                            const response = await axios.get(`/users/${userId}`);
                            return response.data;
                        })
                    );
                    setFriends(friendList);
                }
            };
            fetchFriends();
        }, []);

        return (
            <>
                <h4 className="rightbarTitle">ユーザー情報</h4>
                <div className="rightbarInfoItem">
                    <span className="rightbarInfoKey">出身：</span>
                    <span className="rightbarInfoKey">-</span>
                </div>
                <h4 className="rightbarFriends">{`${user.username}`} の友達</h4>
                <div className="rightbarFollowings">
                    {friends.map((user) => (
                        <div className="rightbarFollowing" key={user._id}>
                            <Link to={`/profile/${user.username}`}>
                                <img src={PUBLIC_FOLDER + user.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"} alt="" className="rightbarFollowingImg" loading="lazy" />
                            </Link>
                            <span className="rightbarFollowingName">{user.username}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    const formatKey = (key) => {
        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2') // キャメルケースをスペースで分割
            .replace(/^./, (str) => str.toUpperCase()); // 最初の文字を大文字に
    };

    const MetadataRightbar = () => {
        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="rightbarTitle">論文の詳細</h4>
                    <button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                        onClick={() => setShowMetadata(false)}
                    >
                        ×
                    </button>
                </div>
                <div className="rightbarInfo">
                    {Object.entries(metadata).map(([key, value]) => (
                        <div className="rightbarInfoItem" key={key}>
                            <span className="rightbarInfoKey">{formatKey(key)}:</span>
                            {key === 'url' ? (
                                <a href={value} target="_blank" rel="noopener noreferrer" className="rightbarInfoValue">
                                    {value}
                                </a>
                            ) : (
                                <span className="rightbarInfoValue">{value}</span>
                            )}
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="rightbar">
            <div className="rightbarWrapper">
                {showMetadata ? (
                    <MetadataRightbar />
                ) : user ? (
                    <ProfileRightbar />
                ) : (
                    <HomeRightbar />
                )}
            </div>
        </div>
    );
}
