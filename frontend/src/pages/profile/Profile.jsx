import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Topbar from '../../components/topbar/Topbar'
import Sidebar from '../../components/sidebar/Sidebar'
import Timeline from '../../components/timeline/Timeline'
import Rightbar from '../../components/rightbar/Rightbar'
import axios from 'axios'
import "./Profile.css"
import EditNoteIcon from '@mui/icons-material/EditNote';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../../states/AuthContext';
import { logoutCall } from '../../states/ActionCalls';


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

  const [editUsername, setEditUsername] = useState(loginUser?.username || "");
  const [editDesc, setEditDesc] = useState(loginUser?.desc || "");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperMetadata, setSelectedPaperMetadata] = useState(null);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/users?username=${username}`);
        setUser(response.data);
      } catch (err) {
        console.error("ユーザー情報の取得に失敗しました", err);
      }
    }
    fetchUser();
  }, [username]); // loginUser.usernameとloginUser.descを依存配列から削除

  const handleEditUser = async () => {
    try {
      // サーバーに更新リクエストを送信
      await axios.put(`/api/users/${user._id}`, {
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

  const handleLogout = () => {
    try {
      // まずナビゲーション処理を準備
      const navigateToLogin = () => {
        navigate("/login", { replace: true });
      };

      // ログアウト処理を実行
      logoutCall(dispatch);

      // タイムアウトを設定して状態更新が完了した後にナビゲーションを行う
      setTimeout(() => {
        navigateToLogin();
      }, 0);
    } catch (err) {
      console.error("ログアウト処理中にエラーが発生しました:", err);
    }
  }

  // フォロワーかどうかの初期値を定める
  useEffect(() => {
    if (loginUser && loginUser.followings && user && user._id) {
      setIsFollowing(loginUser.followings.includes(user._id));
    }
  }, [loginUser, user]);

  const handleFollow = async () => {
    try {
      if (!user || !user._id || !loginUser) return;
      await axios.put(`/api/users/${user._id}/follow`, { userId: loginUser._id });

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
      if (!user || !user._id || !loginUser) return;

      await axios.put(`/api/users/${user._id}/unfollow`, { userId: loginUser._id });

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
    // 自分自身のプロフィールの場合のみ画像変更可能
    if (loginUser && user && loginUser.username === user.username) {
      setImageType(type);
      setShowModal(true);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const data = new FormData(); // ファイルを送信するためのFormDataオブジェクトを作成
      const fileName = Date.now() + "_" + file.name;
      data.append("name", fileName);
      data.append("file", file);
      // 画像種別
      data.append("type", imageType === "cover" ? "cover" : "profile");

      try {
        // 画像をアップロード
        const uploadResponse = await axios.post("/api/upload", data);
        if (uploadResponse.status !== 200) {
          throw new Error("画像のアップロードに失敗しました");
        }

        // データベースのユーザー情報を更新
        await axios.put(`/api/users/${user._id}`, {
          userId: user._id, // 自分のユーザーID
          [imageType === "cover" ? "coverPicture" : "profilePicture"]: fileName,
        });

        // AuthContextのユーザー情報を更新
        const updatedUser = {
          ...loginUser,
          [imageType === "cover" ? "coverPicture" : "profilePicture"]: fileName,
        };
        dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });

        // ローカルのユーザー状態を更新
        setUser(updatedUser);

        setShowModal(false);
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
                src={user?.coverPicture
                  ? PUBLIC_FOLDER + "/profile/" + user.coverPicture
                  : PUBLIC_FOLDER + "/profile/noCover.jpg"}
                alt=""
                className="profileCoverImg"
                onClick={() => handleImageClick("cover")} // クリックイベントを追加
              />
              <img
                src={user?.profilePicture
                  ? PUBLIC_FOLDER + "/profile/" + user.profilePicture
                  : PUBLIC_FOLDER + "/profile/noAvatar.png"}
                alt=""
                className="profileUserImg"
                onClick={() => handleImageClick("profile")} // クリックイベントを追加
              />
              <div className="profileWrapper">
                <div className="profileInfo">
                  <div className="profileNameItems">
                    <span className="profileName">{user.username}</span>
                    {loginUser && user && loginUser.username === user.username && (
                      <EditNoteIcon className="editNameIcon" onClick={openEditModal} />
                    )}
                  </div>
                  <span className="profileInfoDesc">{user.desc}</span>
                </div>
                {loginUser && user && loginUser.username === user.username ? (
                  <button
                    className="logoutButton"
                    onClick={handleLogout}
                  >
                    <LogoutIcon className="logoutIcon" />
                    ログアウト
                  </button>
                ) : (
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
            <Timeline username={user.username} onMetadataSelect={setSelectedPaperMetadata} />
            <div className="userDetail">
              <Rightbar user={user} metadata={selectedPaperMetadata} />
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
              <span className="filelabel" title="ファイルを選択">
                <img src={PUBLIC_FOLDER + "/icons/camera.png"} width="32" height="26" alt="＋画像" />
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
