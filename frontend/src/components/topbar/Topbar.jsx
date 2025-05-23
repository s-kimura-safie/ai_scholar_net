import "./Topbar.css"
import { Search, Chat, Notifications, Close } from '@mui/icons-material'; //  SVG形式のアイコンをインポート
import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';
import useDebounce from "../../utils/useDebounce";

export default function Topbar() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    const { user } = useContext(AuthContext); // global state
    const { dispatch } = useContext(AuthContext);
    const [searchKeyword, setSearchKeyword] = useState("");
    const debouncedKeyword = useDebounce(searchKeyword, 500);

    // ページが更新されたときに検索キーワードをリセット
    useEffect(() => {
        if (debouncedKeyword.trim() !== "") {
            console.log("検索処理を実行:", debouncedKeyword);
            dispatch({ type: "SET_SEARCH_KEYWORD", payload: debouncedKeyword });
        } else {
            dispatch({ type: "SET_SEARCH_KEYWORD", payload: "" });
        }
    }, [debouncedKeyword, dispatch]);

    const handleSearchChange = (e) => {
        setSearchKeyword(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchKeyword("");
        dispatch({ type: "SET_SEARCH_KEYWORD", payload: "" });
    };

    return (
        <div className="topbarContainer">
            <div className="topbarLeft">
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span className="logo">AI Scholar Net</span>
                </Link>
            </div>
            <div className="topbarCenter">
                <div className="searchBar">
                    <Search className="searchIcon"></Search>
                    <input
                        type="text"
                        placeholder="検索キーワードを入力..."
                        value={searchKeyword}
                        onChange={handleSearchChange}
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
