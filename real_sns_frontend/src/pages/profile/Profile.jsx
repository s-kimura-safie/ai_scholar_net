import React, { useState, useEffect } from 'react'
import Topbar from '../../components/topbar/Topbar'
import Sidebar from '../../components/sidebar/Sidebar'
import Timeline from '../../components/timeline/Timeline'
import Rightbar from '../../components/rightbar/Rightbar'
import axios from 'axios'
import "./Profile.css"

import {useParams} from 'react-router-dom'


const Profile = () => {
  const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

  const [user, setUser] = useState({});
  const username = useParams().username;

  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get(`/users?username=${username}`);
      setUser(response.data);
    }
    fetchUser();
  }, [username]); //

  return (
    <>
      <Topbar />
      <div className="profile">
        <Sidebar />
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover">
              <img src={PUBLIC_FOLDER + user.coverPicture || PUBLIC_FOLDER + "/post/3.jpeg"} alt="" className="profileCoverImg" />
              <img src={PUBLIC_FOLDER + user.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"} alt="" className="profileUserImg" />
              <div className="profileInfo">
                <span className='profileInfoName'>{user.username}</span>
                <span className='profileInfoDesc'>{user.desc}</span>
              </div>
            </div>
          </div>
          <div className="profileRightBottom">
            <Timeline username={user.username} />
            <Rightbar user={user} />
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile
