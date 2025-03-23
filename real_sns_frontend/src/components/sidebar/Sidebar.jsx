import React from 'react'
import { useState, useEffect, useContext } from 'react';
import "./Sidebar.css"
import { Favorite, Home, Person, Search, Settings } from '@mui/icons-material';
import BallotIcon from '@mui/icons-material/Ballot';
import CloseFriend from '../closeFriend/CloseFriend'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import axios from 'axios';


export default function Sidebar() {
    const { user: loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用

    const [friends, setFriends] = useState([]);

    // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
    useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
        const fetchFriends = async () => {
            // Promise.all: 複数のPromiseを並行して実行し、すべてのPromiseが解決されるのを待つためのメソッドです。
            // 引数として渡されたすべてのPromiseが解決されると、結果を配列として返します。
            if (loginUser.followings) {
                const friendList = await Promise.all(
                    loginUser.followings.map(async (userId) => {
                        const response = await axios.get(`/users/${userId}`);
                        return response.data;
                    })
                );
                setFriends(friendList);
            }
        };
        fetchFriends();
    }, [loginUser.followings]);

    return (
        <div className="sidebar">
            <div className="sidebarWrapper">
                <ul className="sidebarList">
                    <Link to={`/profile/${loginUser.username}`} style={{ textDecoration: 'none', color: "black" }}>
                        <li className="sidebarListItem">
                            <Person className="sidebarIcon" />
                            <span className="sidebarListItemText">マイページ</span>
                        </li>
                    </Link>
                    <Link to="/" style={{ textDecoration: 'none', color: "black" }}>
                        <li className="sidebarListItem">
                            <BallotIcon className="sidebarIcon" />
                            <span className="sidebarListItemText">タイムライン</span>
                        </li>
                    </Link>
                    <li className="sidebarListItem">
                        <Search className="sidebarIcon" />
                        <span className="sidebarListItemText">検索</span>
                    </li>
                    <li className="sidebarListItem">
                        <Favorite className="sidebarIcon" />
                        <span className="sidebarListItemText">お気に入り</span>
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
