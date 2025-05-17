import React from 'react'
import './CloseFriend.css'
import { Link } from 'react-router-dom'

const CloseFriend = (props) => {
    const { user } = props
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    return (
        <div>
            <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none', color: "black" }}>
                <li className="sidebarFriend">
                    <img src={PUBLIC_FOLDER + "profile/" + user.profilePicture || PUBLIC_FOLDER + "profile/noAvatar.png"} alt="" className="sidebarFriendImg" />
                    <span className="sidebarFriendName">{user.username}</span>
                </li>
            </Link>
        </div>
    )
}

export default CloseFriend
