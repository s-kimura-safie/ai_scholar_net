import React from 'react'
import "./Sidebar.css"
import { Bookmark, Home, Notifications, Person, Search, Settings } from '@mui/icons-material';
import CloseFriend from '../closeFriend/CloseFriend'
import { Users } from '../../dummyData'
import { Link } from 'react-router-dom';

export default function Sidebar() {
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
                        <Link to='/profile/shincode' style={{ textDecoration: 'none', color: "black" }}>
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
                    {Users.map((user) => (
                        <CloseFriend user={user} key={user.id} />
                    ))}
                </ul>
            </div>
        </div>
    )
}
