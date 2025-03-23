import React, { useState, useEffect, useContext } from 'react'
import Topbar from '../../components/topbar/Topbar'
import Sidebar from '../../components/sidebar/Sidebar'
import Timeline from '../../components/timeline/Timeline'
import Rightbar from '../../components/rightbar/Rightbar'
import axios from 'axios'
import "./Profile.css"
import EditNoteIcon from '@mui/icons-material/EditNote';
import { AuthContext } from '../../states/AuthContext';


import { useParams } from 'react-router-dom'


const Profile = () => {
  const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
  const { user: loginUser } = useContext(AuthContext);

  const [user, setUser] = useState({});
  const [showModal, setShowModal] = useState(false); // モーダル表示状態
  const [selectedImage, setSelectedImage] = useState(null); // 選択された画像
  const [imageType, setImageType] = useState(""); // 画像の種類 ("cover" または "profile")
  const username = useParams().username; // URLのパラメータを取得

  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get(`/users?username=${username}`);
      setUser(response.data);
    }
    fetchUser();
  }, [username]);

  const handleImageClick = (type) => {
    setImageType(type); // 画像の種類を設定
    setShowModal(true); // モーダルを表示
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedImage(file);
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
                  <div className='profileNameItems'>
                    <span className='profileName'>{user.username}</span>
                    {loginUser.username === username && <EditNoteIcon className="editNameIcon" onClick={() => { }} />}
                  </div>
                  <span className='profileInfoDesc'>{user.desc}</span>
                </div>
                {loginUser.username !== username && (
                  <button className="followButton" onClick={() => { }}>
                    フォローする
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

      {/* モーダル */}
      {showModal && (
        <div className="modal">
          <div className="modalContent">
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
              className="modalButton cancelButton"
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
