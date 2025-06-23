import "./Topbar.css"
import { Search, Chat, Notifications, Close } from '@mui/icons-material'; //  SVG形式のアイコンをインポート
import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import useDebounce from "../../utils/useDebounce";

export default function Topbar() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    const { user, dispatch } = useContext(AuthContext);
    const [searchKeyword, setSearchKeyword] = useState("");
    const debouncedKeyword = useDebounce(searchKeyword, 500);

    useEffect(() => {
        dispatch({ type: "SET_SEARCH_KEYWORD", payload: debouncedKeyword.trim() });
    }, [debouncedKeyword, dispatch]);

    const handleClearSearch = () => {
        setSearchKeyword("");
    };

    return (
        <div className="topbarContainer">
            <div className="topbarLeft">
                <Link to="/" className="logoLink" style={{ textDecoration: 'none' }}>
                    <img src = {PUBLIC_FOLDER + "/icons/SchalAI_san.png"} alt="" className="logoImg"/>
                    <span className="logo">ScholAI</span>
                </Link>
            </div>
            <div className="topbarCenter">
                <div className="searchBar">
                    <Search className="searchIcon" />
                    <input
                        type="text"
                        placeholder="検索キーワードを入力..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="searchInput"
                    />
                    {searchKeyword && ( // 検索キーワードがある場合のみクリアボタンを表示
                        <Close
                            className="clearSearchInput"
                            onClick={handleClearSearch}
                            style={{ cursor: "pointer" }}
                        />
                    )}
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
                    {user ? (
                        <Link to={`/profile/${user.username}`}>
                            <img src={user.profilePicture
                                ? PUBLIC_FOLDER + "/profile/" + user.profilePicture
                                : PUBLIC_FOLDER + "/profile/noAvatar.png"}
                                alt="" className="topbarImg" />
                        </Link>
                    ) : (
                        <Link to="/login">
                            <img src={PUBLIC_FOLDER + "/profile/noAvatar.png"}
                                alt="" className="topbarImg" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
