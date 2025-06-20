import React from 'react'
import "./Login.css"
import { useContext, useRef } from 'react';
import { loginCall } from '../../states/ActionCalls';
import { AuthContext } from '../../states/AuthContext';
import { Link } from 'react-router-dom';


function Login() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
    const email = useRef(); // useRefを使ってemailの要素を監視する。
    const password = useRef();
    const { user, isFetching, error, dispatch } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault(); // ページがリロードされるのを防ぐ
        loginCall({
            email: email.current.value,
            password: password.current.value
        },
            dispatch
        );
    }

    return (
        <div className="login"> {
            <div className="loginWrapper">
                <div className="loginLeft">
                    <img src = {PUBLIC_FOLDER + "/icons/SchalAI_san.png"} alt="" className="logoImg"/>
                    <h3 className='loginLogo'>ScholAI</h3>
                </div>
                <div className="loginRight">
                    <form className="loginBox" onSubmit={(e) => handleSubmit(e)}>
                        <p className='loginMsg'>アカウント情報を入力してください</p>
                        <input type="email" placeholder="メールアドレス" className="loginInput" required ref={email} autoComplete="email"/>
                        <input type="password" placeholder="パスワード" className="loginInput" minLength="6" ref={password} autoComplete="current-password"/>
                        <button className='loginButton'>ログイン</button>
                    </form>
                    <div className="toRegisterPage">初めてご利用の方は
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <span className="pathRegisterPage">こちら</span>
                        </Link>
                    </div>
                </div>
            </div>
        }
        </div>
    )
}

export default Login
