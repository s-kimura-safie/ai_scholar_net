import "./Topbar.css"
import { Search, Chat, Notifications } from '@mui/icons-material'; //  SVG形式のアイコンをインポート
import React, { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';

export default function Topbar() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    const { user } = useContext(AuthContext); // global state
    const { dispatch } = useContext(AuthContext);

    // ページが更新されたときに検索キーワードをリセット
    useEffect(() => {
        dispatch({ type: "SET_SEARCH_KEYWORD", payload: "" });
    }, [dispatch]);


    const handleSearchChange = (e) => {
        dispatch({ type: "SET_SEARCH_KEYWORD", payload: e.target.value }); // 検索キーワードを更新
    };

    return (
        <div className="topbarContainer">
            <div className="topbarLeft">
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span className="logo">Real SNS</span>
                </Link>
            </div>
            <div className="topbarCenter">
                <div className="searchBar">
                    <Search className="searchIcon"></Search>
                    <input
                        type="text"
                        placeholder="検索キーワードを入力..."
                        onChange={handleSearchChange}
                        className="searchInput"
                    />
                </div>
            </div>
            <div className="topbarRight">
                <div className="topbarIconItems">
                    <div className="topbarIconItem">
                        <Chat />
                        <span className="topbarIconBadge">?</span>
                    </div>
                    <div className="topbarIconItem">
                        <Notifications />
                        <span className="topbarIconBadge">?</span>
                    </div>
                    <Link to={`/profile/${user.username}`}>
                        <img src={user.profilePicture
                            ? PUBLIC_FOLDER + user.profilePicture
                            : PUBLIC_FOLDER + "/person/noAvatar.png"}
                            alt="" className="topbarImg" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
