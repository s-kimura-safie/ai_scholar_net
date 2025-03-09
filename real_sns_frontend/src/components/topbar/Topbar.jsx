import { Search } from '@mui/icons-material';
import { Chat, Notifications } from '@mui/icons-material';
import React, { useContext } from 'react'
import { Link } from 'react-router-dom';
import "./Topbar.css"
import { AuthContext } from '../../states/AuthContext';

export default function Topbar() {
    const { user } = useContext(AuthContext); // global state
    console.log(`Topbar user: ${user.profilePicture}`);
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

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
                        className="searchInput"
                        placeholder="探し物は？"
                    />
                </div>
            </div>
            <div className="topbarRight">
                <div className="topbarIconItems">
                    <div className="topbarIconItem">
                        <Chat />
                        <span className="topbarIconBadge">1</span>
                    </div>
                    <div className="topbarIconItem">
                        <Notifications />
                        <span className="topbarIconBadge">5</span>
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
