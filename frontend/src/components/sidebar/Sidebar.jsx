import React from 'react'
import { useState, useEffect, useContext } from 'react';
import "./Sidebar.css"
import { Favorite, Home, Person, Search, Settings, Close } from '@mui/icons-material';

import BallotIcon from '@mui/icons-material/Ballot';
import CloseFriend from '../closeFriend/CloseFriend'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import axios from 'axios';


export default function Sidebar() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const { user: loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用

    const [friends, setFriends] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleClearSearch = () => {
        setSearchKeyword("");
    };

    // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
    useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
        const fetchFriends = async () => {
            // Promise.all: 複数のPromiseを並行して実行し、すべてのPromiseが解決されるのを待つためのメソッドです。
            // 引数として渡されたすべてのPromiseが解決されると、結果を配列として返します。
            if (loginUser && loginUser.followings) {
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
    }, [loginUser]);

    const handleSearch = async (e) => {
        const keyword = e.target.value;
        setSearchKeyword(keyword);
        if (keyword.trim() !== "") {
            try {
                const response = await axios.get(`/users/search?q=${keyword}`);
                setSearchResults(response.data);
            } catch (err) {
                console.error("検索エラー:", err);
            }
        } else {
            setSearchResults([]);
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebarWrapper">
                <ul className="sidebarList">
                    {loginUser ? (
                        <Link to={`/profile/${loginUser.username}`} style={{ textDecoration: 'none', color: "black" }}>
                            <li className="sidebarListItem">
                                <Person className="sidebarIcon" />
                                <span className="sidebarListItemText">マイページ</span>
                            </li>
                        </Link>
                    ) : (
                        <Link to="/login" style={{ textDecoration: 'none', color: "black" }}>
                            <li className="sidebarListItem">
                                <Person className="sidebarIcon" />
                                <span className="sidebarListItemText">ログイン</span>
                            </li>
                        </Link>
                    )}
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
                <h4 className="sidebarTitle">ユーザーを探す</h4>
                <div className="searchBar">
                    <input
                        type="text"
                        placeholder="ユーザーを検索..."
                        value={searchKeyword}
                        onChange={handleSearch}
                        className="sidebarSearchInput"
                    />
                    {searchKeyword && ( // 検索キーワードがある場合のみクリアボタンを表示
                        <Close
                            className="clearSearchInput"
                            onClick={handleClearSearch}
                            style={{ cursor: "pointer" }}
                        />
                    )}
                </div>
                {searchKeyword && searchResults.length > 0 && (
                    <ul className="sidebarSearchResults">
                        {searchResults.map((user) => (
                            <Link
                                to={`/profile/${user.username}`}
                                key={user._id}
                                style={{ textDecoration: 'none', color: 'black' }}
                            >
                                <li className="sidebarSearchResultItem" style={{ cursor: "pointer" }}>
                                    <img
                                        src={user.profilePicture
                                            ? PUBLIC_FOLDER + user.profilePicture
                                            : PUBLIC_FOLDER + "/person/noAvatar.png"}
                                        alt=""
                                    />
                                    <span>{user.username}</span>
                                </li>
                            </Link>
                        ))}
                    </ul>
                )}
                <h4 className="sidebarTitle">フォローしているユーザー</h4>
                {loginUser && (
                    <div className="sidebarFriends">
                        <ul className="sidebarFriendList">
                            {friends.map((user) => (
                                <CloseFriend user={user} key={user._id} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
