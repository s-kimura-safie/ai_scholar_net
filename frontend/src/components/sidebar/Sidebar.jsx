import React, { useState, useEffect, useContext } from 'react';
import "./Sidebar.css"
import { Favorite, Person, Search, Settings, Close } from '@mui/icons-material';

import BallotIcon from '@mui/icons-material/Ballot';
import CloseFriend from '../closeFriend/CloseFriend'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import { ActiveItemContext } from '../../states/ActiveItemContext';

import axios from 'axios';

export default function Sidebar() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const { user: loginUser } = useContext(AuthContext); // user:loginUser => userをloginUserとして使用
    const { activeItem, setActiveItem } = useContext(ActiveItemContext); // useContextでactiveItemを取得

    const [friends, setFriends] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleClearSearch = () => {
        setSearchKeyword("");
    };

    const handleItemClick = (item) => {
        setActiveItem(item);
    };

    // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
    useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
        const fetchFriends = async () => {
            // Promise.all: 複数のPromiseを並行して実行し、すべてのPromiseが解決されるのを待つためのメソッドです。
            // 引数として渡されたすべてのPromiseが解決されると、結果を配列として返します。
            if (loginUser && loginUser.followings) {
                const friendList = await Promise.all(
                    loginUser.followings.map(async (userId) => {
                        const response = await axios.get(`/api/users/${userId}`);
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
                const response = await axios.get(`/api/users/search?q=${keyword}`);
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
                            <li
                                className={`sidebarListItem ${activeItem === 'profile' ? 'active' : ''}`}
                                onClick={() => handleItemClick('profile')}
                            >
                                <Person className="sidebarIcon" />
                                <span className="sidebarListItemText">マイページ</span>
                            </li>
                        </Link>
                    ) : (
                        <Link to="/login" style={{ textDecoration: 'none', color: "black" }}>
                            <li
                                className={`sidebarListItem ${activeItem === 'login' ? 'active' : ''}`}
                                onClick={() => handleItemClick('login')}
                            >
                                <Person className="sidebarIcon" />
                                <span className="sidebarListItemText">ログイン</span>
                            </li>
                        </Link>
                    )}
                    <Link to="/" style={{ textDecoration: 'none', color: "black" }}>
                        <li
                            className={`sidebarListItem ${activeItem === 'timeline' ? 'active' : ''}`}
                            onClick={() => handleItemClick('timeline')}
                        >
                            <BallotIcon className="sidebarIcon" />
                            <span className="sidebarListItemText">タイムライン</span>
                        </li>
                    </Link>
                    <Link to="/liked-posts" style={{ textDecoration: 'none', color: "black" }}>
                        <li
                            className={`sidebarListItem ${activeItem === 'liked-posts' ? 'active' : ''}`}
                            onClick={() => handleItemClick('liked-posts')}
                        >
                            <Favorite className="sidebarIcon" />
                            <span className="sidebarListItemText">お気に入り</span>
                        </li>
                    </Link>
                    <Link to="/upload-paper" style={{ textDecoration: 'none', color: "black" }}>
                        <li
                            className={`sidebarListItem ${activeItem === 'upload-paper' ? 'active' : ''}`}
                            onClick={() => handleItemClick('upload-paper')}
                        >
                            <BallotIcon className="sidebarIcon" />
                            <span className="sidebarListItemText">論文投稿</span>
                        </li>
                    </Link>
                    <li
                        className={`sidebarListItem ${activeItem === 'search' ? 'active' : ''}`}
                        onClick={() => handleItemClick('search')}
                    >
                        <Search className="sidebarIcon" />
                        <span className="sidebarListItemText">検索</span>
                    </li>
                    <li
                        className={`sidebarListItem ${activeItem === 'settings' ? 'active' : ''}`}
                        onClick={() => handleItemClick('settings')}
                    >
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
                                            ? PUBLIC_FOLDER + "/profile/" + user.profilePicture
                                            : PUBLIC_FOLDER + "/profile/noAvatar.png"}
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
                        {Array.isArray(friends) && friends.map((user, idx) =>
                            user && user._id ? (
                                <CloseFriend user={user} key={user._id} />
                            ) : null
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
