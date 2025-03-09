import React from 'react'
import './CloseFriend.css'
import { Link } from 'react-router-dom'

const CloseFriend = (props) => {
    const { user } = props
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    return (
        <div>
            <li className="sidebarFriend">
                <Link to={`/profile/${user.username}`}>
                    <img src={PUBLIC_FOLDER + user.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"} alt="" className="sidebarFriendImg" />
                </Link>
                <span className="sidebarFriendName">{user.username}</span>
            </li>
        </div>
    )
}

export default CloseFriend
