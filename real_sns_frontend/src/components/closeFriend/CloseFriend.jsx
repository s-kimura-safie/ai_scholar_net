import React from 'react'

const CloseFriend = (props) => {
    const {user} = props
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    return (
        <div>
            <li className="sidebarFriend">
                <img src={PUBLIC_FOLDER+user.profilePicture} alt="" className="sidebarFriendImg" />
                <span className="sidebarFriendName">{user.username}</span>
            </li>
        </div>
    )
}

export default CloseFriend
