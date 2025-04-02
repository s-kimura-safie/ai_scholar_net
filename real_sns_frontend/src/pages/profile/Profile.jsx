import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Topbar from '../../components/topbar/Topbar'
import Sidebar from '../../components/sidebar/Sidebar'
import Timeline from '../../components/timeline/Timeline'
import Rightbar from '../../components/rightbar/Rightbar'
import axios from 'axios'
import "./Profile.css"
import EditNoteIcon from '@mui/icons-material/EditNote';
import { AuthContext } from '../../states/AuthContext';


const Profile = () => {
  const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
  const { user: loginUser } = useContext(AuthContext);
  const { dispatch } = useContext(AuthContext);

  const username = useParams().username; // URLのパラメータを取得
  const navigate = useNavigate(); // ページ遷移用の関数

  const [user, setUser] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [showModal, setShowModal] = useState(false); // モーダル表示状態
  const [imageType, setImageType] = useState(""); // 画像の種類 ("cover" または "profile")

  const [editUsername, setEditUsername] = useState(loginUser.username || "");
  const [editDesc, setEditDesc] = useState(loginUser.desc || "");
  const [showEditModal, setShowEditModal] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get(`/users?username=${username}`);
      setUser(response.data);
    }
    fetchUser();
  }, [username, loginUser.username, loginUser.desc]);

  const handleEditUser = async () => {
    try {
      // サーバーに更新リクエストを送信
      await axios.put(`/users/${user._id}`, {
        userId: loginUser._id, // 自分のユーザーID
        username: editUsername,
        desc: editDesc,
      });

      // ローカルの状態を更新
      const updatedUser = {
        ...loginUser,
        username: editUsername,
        desc: editDesc,
      };
      dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });

      setShowEditModal(false); // 編集モードを終了

      // URL を新しいユーザー名にリダイレクト
      navigate(`/profile/${editUsername}`);
      window.location.reload();

    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const openEditModal = () => {
    setShowEditModal(true); // モーダルを表示
  };

  const closeEditModal = () => {
    setShowEditModal(false); // モーダルを非表示
  };


  // フォロワーかどうかの初期値を定める
  useEffect(() => {
    setIsFollowing(loginUser.followings.includes(user._id));
  }, [loginUser.followings, user._id]);

  const handleFollow = async () => {
    try {
      await axios.put(`/users/${user._id}/follow`, { userId: loginUser._id });

      // ローカルの状態を更新
      const updatedUser = {
        ...loginUser,
        followings: [...loginUser.followings, user._id], // フォローリストに追加
      };
      dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });

      setIsFollowing(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.put(`/users/${user._id}/unfollow`, { userId: loginUser._id });

      // ローカルの状態を更新
      const updatedUser = {
        ...loginUser,
        followings: loginUser.followings.filter((id) => id !== user._id), // フォローリストから削除
      };
      dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });

      setIsFollowing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageClick = (type) => {
    setImageType(type); // 画像の種類を設定
    setShowModal(true); // モーダルを表示
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const data = new FormData(); // ファイルを送信するためのFormDataオブジェクトを作成
      const fileName = Date.now() + "_" + file.name;
      data.append("name", fileName);
      data.append("file", file);

      try {
        // 画像をアップロード
        const uploadResponse = await axios.post("/upload", data);
        const filePath = uploadResponse.data.filePath;

        // ユーザー情報を更新
        await axios.put(`/users/${user._id}`, {
          userId: user._id, // 自分のユーザーID
          [imageType === "cover" ? "coverPicture" : "profilePicture"]: fileName, // カバー写真またはプロフィール写真を更新
        });

        // 状態を更新
        setUser((prev) => ({
          ...prev,
          [imageType === "cover" ? "coverPicture" : "profilePicture"]: filePath,
        }));

        // ローカル保存
        // const updatedUser = {
        //   ...loginUser,
        //   [imageType === "cover" ? "coverPicture" : "profilePicture"]: filePath,
        // };
        // dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });

        setShowModal(false); // モーダルを閉じる
        window.location.reload(); // ページをリロード
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <>
      <Topbar />
      <div className="profile">
        <Sidebar />
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover">
              <img
                src={PUBLIC_FOLDER + user.coverPicture || PUBLIC_FOLDER + "/post/3.jpeg"}
                alt=""
                className="profileCoverImg"
                onClick={() => handleImageClick("cover")} // クリックイベントを追加
              />
              <img
                src={PUBLIC_FOLDER + user.profilePicture || PUBLIC_FOLDER + "/person/noAvatar.png"}
                alt=""
                className="profileUserImg"
                onClick={() => handleImageClick("profile")} // クリックイベントを追加
              />
              <div className="profileWrapper">
                <div className="profileInfo">
                  <div className="profileNameItems">
                    <span className="profileName">{user.username}</span>
                    {loginUser.username === username && (
                      <EditNoteIcon className="editNameIcon" onClick={openEditModal} />
                    )}
                  </div>
                  <span className="profileInfoDesc">{user.desc}</span>
                </div>
                {loginUser.username !== username && (
                  <button
                    className={`followButton ${isFollowing ? "unfollowButton" : "followButton"}`}
                    onClick={() => {
                      if (isFollowing) {
                        handleUnfollow();
                      } else {
                        handleFollow();
                      }
                    }}
                  >
                    {isFollowing ? "フォローをやめる" : "フォローする"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="profileRightBottom">
            <Timeline username={user.username} />
            <div className="userDetail">
              <Rightbar user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* プロフィール情報編集モーダル */}
      {showEditModal && (
        <div className="modal" onClick={() => setShowEditModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">プロフィールを編集</h3>
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="editInput"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="自己紹介を入力"
              className="editTextarea"
            />
            <div className="modalButtons">
              <button onClick={handleEditUser} className="saveButton">保存</button>
              <button onClick={closeEditModal} className="cancelButton">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* 画像変更モーダル */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">
              {imageType === "cover" ? "カバー写真を選択してください" : "プロフィール写真を選択してください"}
            </h3>
            <label>
              <span class="filelabel" title="ファイルを選択">
                <img src={PUBLIC_FOLDER + "/preset/camera-orange-rev.png"} width="32" height="26" alt="＋画像" />
                選択
              </span>
              <input type="file" onChange={handleImageChange} name="datafile" id="filesend"></input>
            </label>
            <button
              className="cancelButton"
              onClick={() => setShowModal(false)}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile
