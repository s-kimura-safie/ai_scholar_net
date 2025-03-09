import React from 'react'
import { useState, useEffect, useContext } from 'react';
import "./Sidebar.css"
import { Bookmark, Home, Notifications, Person, Search, Settings } from '@mui/icons-material';
import CloseFriend from '../closeFriend/CloseFriend'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import axios from 'axios';


export default function Sidebar() {
    const { user: loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用

    const [friends, setFriends] = useState([]);
    console.log("friends: ", friends);

    // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
    useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
        const fetchFriends = async () => {
            // Promise.all: 複数のPromiseを並行して実行し、すべてのPromiseが解決されるのを待つためのメソッドです。
            // 引数として渡されたすべてのPromiseが解決されると、結果を配列として返します。
            const friendList = await Promise.all(
                loginUser.followings.map(async (userId) => {
                    const response = await axios.get(`/users/${userId}`);
                    return response.data;
                })
            );
            setFriends(friendList);
        };
        fetchFriends();
    }, [loginUser.followings]);

    return (
        <div className="sidebar">
            <div className="sidebarWrapper">
                <ul className="sidebarList">
                    <li className="sidebarListItem">
                        <Home className="sidebarIcon" />
                        <Link to="/" style={{ textDecoration: 'none', color: "black" }}>
                            <span className="sidebarListItemText">ホーム</span>
                        </Link>
                    </li>
                    <li className="sidebarListItem">
                        <Search className="sidebarIcon" />
                        <span className="sidebarListItemText">検索</span>
                    </li>
                    <li className="sidebarListItem">
                        <Notifications className="sidebarIcon" />
                        <span className="sidebarListItemText">通知</span>
                    </li>
                    <li className="sidebarListItem">
                        <Bookmark className="sidebarIcon" />
                        <span className="sidebarListItemText">ブックマーク</span>
                    </li>
                    <li className="sidebarListItem">
                        <Person className="sidebarIcon" />
                        <Link to={`/profile/${loginUser.username}`} style={{ textDecoration: 'none', color: "black" }}>
                            <span className="sidebarListItemText">プロフィール</span>
                        </Link>
                    </li>
                    <li className="sidebarListItem">
                        <Settings className="sidebarIcon" />
                        <span className="sidebarListItemText">設定</span>
                    </li>
                </ul>
                <hr className="sidebarHr" />
                <ul className="sidebarFriendList">
                    {friends.map((user) => (
                        <CloseFriend user={user} key={user._id} />
                    ))}
                </ul>
            </div>
        </div>
    )
}
