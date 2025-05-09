import React from 'react'
import "./Rightbar.css"
// import Online from '../online/Online'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';


export default function Rightbar({ user, metadata }) {

    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const HomeRightbar = () => {
        return (
            <>
                <div className="eventContainer">
                    <img src={PUBLIC_FOLDER + "/star.png"} alt="" className="starImg" />
                    <span className="eventText">
                        <b>フォロワー限定</b>イベント開催中！
                    </span>
                </div>
                <img src={PUBLIC_FOLDER + "/ad.jpeg"} alt="" className="eventImg" />
                <h4 className="rightbartitle">オンラインの友達</h4>
                <ul className="rightbarFriendList">
                </ul>

                <div className="promotionTitle">プロモーション広告
                    <img src={PUBLIC_FOLDER + "/promotion/promotion1.jpeg"} alt="" className="promotionImg" />
                    <p className="promotionName">ショッピング</p>
                    <img src={PUBLIC_FOLDER + "/promotion/promotion2.jpeg"} alt="" className="promotionImg" />
                    <p className="promotionName">カーショップ</p>
                    <img src={PUBLIC_FOLDER + "/promotion/promotion3.jpeg"} alt="" className="promotionImg" />
                    <p className="promotionName">Shunsuuuuuu .inc</p>
                </div>
            </>
        );
    }

    const ProfileRightbar = () => {
        const [friends, setFriends] = useState([]);

        // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
        useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
            const fetchFriends = async () => {
                // Promise.all: 複数のPromiseを並行して実行し、すべてのPromiseが解決されるのを待つためのメソッドです。
                // 引数として渡されたすべてのPromiseが解決されると、結果を配列として返します。
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
                <h4 className="rightbarTitle">論文の詳細</h4>
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
                {metadata ? (
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
