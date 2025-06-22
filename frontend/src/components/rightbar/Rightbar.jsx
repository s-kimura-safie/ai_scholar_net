import React, { useContext } from 'react'
import "./Rightbar.css"
// import Online from '../online/Online'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../states/AuthContext';


export default function Rightbar({ user, metadata }) {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    const { user: currentUser, dispatch } = useContext(AuthContext);

    const [showMetadata, setShowMetadata] = useState(!!metadata);

    useEffect(() => {
        setShowMetadata(!!metadata);
    }, [metadata]);

    const HomeRightbar = () => {
        return (
            <>
                <div >
                    <p className="promotionTitle">プロモーション広告</p>
                    <a href="https://safie.co.jp/" target="_blank" rel="noopener noreferrer">
                        <img src={PUBLIC_FOLDER + "/promotion/safie_logo.png"} alt="" className="promotionSafieImg" />
                    </a>
                    <p className="promotionName">セーフィー株式会社</p>
                    <a href="https://www.notion.so/safie/31292149a5f84e59be3ffb70ba71ce47" target="_blank" rel="noopener noreferrer">
                        <img src={PUBLIC_FOLDER + "/promotion/AIV_doraemon.png"} alt="" className="promotionAivImg" />
                    </a>
                    <p className="promotionName">AI Vision</p>
                    {/* <img src={PUBLIC_FOLDER + "/promotion/promotion3.jpeg"} alt="" className="promotionImg" /> */}
                    {/* <p className="promotionName">Shunsuuuuuu .inc</p> */}
                </div>
            </>
        );
    }

    const ProfileRightbar = () => {
        const [friends, setFriends] = useState([]);
        const [isEditing, setIsEditing] = useState(false);
        const [editForm, setEditForm] = useState({
            origin: user.origin || '',
            hobby: user.hobby || '',
            bio: user.bio || ''
        });

        const handleEdit = () => {
            setIsEditing(true);
            setEditForm({
                origin: user.origin || '',
                hobby: user.hobby || '',
                bio: user.bio || ''
            });
        };

        const handleCancel = () => {
            setIsEditing(false);
            setEditForm({
                origin: user.origin || '',
                hobby: user.hobby || '',
                bio: user.bio || ''
            });
        };

        const handleSave = async () => {
            try {
                const response = await axios.put(`/api/users/${user._id}`, {
                    userId: currentUser._id,
                    origin: editForm.origin,
                    hobby: editForm.hobby,
                    bio: editForm.bio
                });

                // ローカルストレージとコンテキストを更新
                const updatedUser = { ...user, ...editForm };

                // 現在のユーザーの情報を更新している場合は、認証コンテキストも更新
                if (currentUser._id === user._id) {
                    const updatedCurrentUser = { ...currentUser, ...editForm };
                    dispatch({ type: "LOGIN_SUCCESS", payload: updatedCurrentUser });
                }

                setIsEditing(false);
                // 親コンポーネントにユーザー情報の更新を通知（必要に応じて）
                window.location.reload(); // 簡単な方法として画面をリロード

            } catch (error) {
                console.error("ユーザー情報の更新に失敗しました:", error);
                alert("更新に失敗しました。もう一度お試しください。");
            }
        };

        const handleInputChange = (field, value) => {
            setEditForm(prev => ({
                ...prev,
                [field]: value
            }));
        };

        // コンポーネントがレンダリングされた後、フォローしているユーザーの情報を取得
        useEffect(() => { // APIでフォロワー情報を取得し終えたら、setFriendsでfriendsを更新
            const fetchFriends = async () => {
                if (user.followings) {
                    const friendList = await Promise.all(
                        user.followings.map(async (userId) => {
                            const response = await axios.get(`/api/users/${userId}`);
                            return response.data;
                        })
                    );
                    setFriends(friendList);
                }
            };
            fetchFriends();
        }, []);

        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="rightbarTitle">ユーザー情報</h4>
                    {currentUser && currentUser._id === user._id && (
                        <div>
                            {isEditing ? (
                                <div className="editButtons">
                                    <button className="saveBtn" onClick={handleSave}>保存</button>
                                    <button className="cancelBtn" onClick={handleCancel}>キャンセル</button>
                                </div>
                            ) : (
                                <button className="editBtn" onClick={handleEdit}>編集</button>
                            )}
                        </div>
                    )}
                </div>

                <div className="rightbarInfoItem">
                    {isEditing ? (
                        <>
                            <div className="editField">
                                <label className="rightbarInfoKey">出身：</label>
                                <input
                                    type="text"
                                    value={editForm.origin}
                                    onChange={(e) => handleInputChange('origin', e.target.value)}
                                    className="editInput"
                                    placeholder="出身地を入力"
                                    maxLength="50"
                                />
                            </div>
                            <div className="editField">
                                <label className="rightbarInfoKey">趣味：</label>
                                <input
                                    type="text"
                                    value={editForm.hobby}
                                    onChange={(e) => handleInputChange('hobby', e.target.value)}
                                    className="editInput"
                                    placeholder="趣味を入力"
                                    maxLength="50"
                                />
                            </div>
                            <div className="editField">
                                <label className="rightbarInfoKey">ひとこと：</label>
                                <input
                                    type="text"
                                    value={editForm.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    className="editInput"
                                    placeholder="ひとことを入力"
                                    maxLength="50"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="rightbarInfoKey">出身：{`${user.origin || '未設定'}`}</span>
                            <span className="rightbarInfoKey">趣味：{`${user.hobby || '未設定'}`}</span>
                            <span className="rightbarInfoKey">ひとこと：{`${user.bio || '未設定'}`}</span>
                        </>
                    )}
                </div>
                <h4 className="rightbarFriends">{`${user.username}`} の友達</h4>
                <div className="rightbarFollowings">
                    {friends.map((friend) => (
                        <div className="rightbarFollowing" key={friend._id}>
                            <Link to={`/profile/${friend.username}`}>
                                <img src={friend.profilePicture ? PUBLIC_FOLDER + "/profile/" + friend.profilePicture : PUBLIC_FOLDER + "/profile/noAvatar.png"} alt="" className="rightbarFollowingImg" loading="lazy" />
                            </Link>
                            <span className="rightbarFollowingName">{friend.username}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    const formatKey = (key) => {
        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2') // キャメルケースをスペースで分割
            .replace(/^./, (str) => str.toUpperCase()); // 最初の文字を大文字に
    };

    const MetadataRightbar = () => {
        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="rightbarTitle">論文の詳細</h4>
                    <button
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                        onClick={() => setShowMetadata(false)}
                    >
                        ×
                    </button>
                </div>
                <div className="rightbarInfo">
                    {Object.entries(metadata).map(([key, value]) => (
                        <div className="rightbarInfoItem" key={key}>
                            <span className="rightbarInfoKey">{formatKey(key)}:</span>
                            {key === 'url' ? (
                                <a href={value} target="_blank" rel="noopener noreferrer" className="rightbarInfoValue">
                                    {value}
                                </a>
                            ) : (
                                <span className="rightbarInfoValue">{value}</span>
                            )}
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="rightbar">
            <div className="rightbarWrapper">
                {showMetadata ? (
                    <MetadataRightbar />
                ) : user ? (
                    <ProfileRightbar />
                ) : (
                    <HomeRightbar />
                )}
            </div>
        </div>
    );
}
