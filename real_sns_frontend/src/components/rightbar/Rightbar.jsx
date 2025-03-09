import React from 'react'
import "./Rightbar.css"
import { Users } from '../../dummyData'
import Online from '../online/Online'

export default function Rightbar({ user }) {

    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;

    const HomeRightbar = () => {
        return (
            <>
                <div className="eventContainer">
                    <img src={PUBLIC_FOLDER+"/star.png"} alt="" className="starImg" />
                    <span className="eventText">
                        <b>フォロワー限定</b>イベント開催中！
                    </span>
                </div>
                <img src={PUBLIC_FOLDER+"/ad.jpeg"} alt="" className="eventImg" />
                <h4 className="rightbartitle">オンラインの友達</h4>
                <ul className="rightbarFriendList">
                    {Users.map((user) => (
                        <Online user={user} key={user.id} />
                    ))}
                </ul>

                <div className="promotionTitle">プロモーション広告
                    <img src={PUBLIC_FOLDER+"/promotion/promotion1.jpeg"} alt="" className="promotionImg" />
                    <p className="promotionName">ショッピング</p>
                    <img src={PUBLIC_FOLDER+"/promotion/promotion2.jpeg"} alt="" className="promotionImg" />
                    <p className="promotionName">カーショップ</p>
                    <img src={PUBLIC_FOLDER+"/promotion/promotion3.jpeg"} alt="" className="promotionImg" />
                    <p className="promotionName">Shunsuuuuuu .inc</p>
                </div>
            </>
        );
    }

    const ProfileRightbar = () => {
        const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
        return (
            <>
                <h4 className="rightbarTitle">ユーザー情報</h4>
                <div className="rightbarInfo">
                    <div className="rightbarInfoItem">
                        <span className="rightbarInfoKey">出身：</span>
                        <span className="rightbarInfoKey">熊本</span>
                    </div>
                    <h4 className="rightbarTitle">あなたの友達</h4>
                    <div className="rightbarFollowings">
                        <div className="rightbarFollowing">
                            <img src={PUBLIC_FOLDER+"/person/1.jpeg"} alt="" className='rightbarFollowingImg'/>
                            <span className="rightbarFollowingName">Shun code</span>
                        </div>
                        <div className="rightbarFollowing">
                            <img src={PUBLIC_FOLDER+"/person/2.jpeg"} alt="" className='rightbarFollowingImg'/>
                            <span className="rightbarFollowingName">Koji code</span>
                        </div>
                        <div className="rightbarFollowing">
                            <img src={PUBLIC_FOLDER+"/person/3.jpeg"} alt="" className='rightbarFollowingImg'/>
                            <span className="rightbarFollowingName">Itoooon code</span>
                        </div>
                        <div className="rightbarFollowing">
                            <img src={PUBLIC_FOLDER+"/person/4.jpeg"} alt="" className='rightbarFollowingImg'/>
                            <span className="rightbarFollowingName">Isshy code</span>
                        </div>
                        <div className="rightbarFollowing">
                            <img src={PUBLIC_FOLDER+"/person/5.jpeg"} alt="" className='rightbarFollowingImg'/>
                            <span className="rightbarFollowingName">Uezy code</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="rightbar">
            <div className="rightbarWrapper">
                {user ? <ProfileRightbar /> : <HomeRightbar />}
            </div>
        </div>
    );
}
