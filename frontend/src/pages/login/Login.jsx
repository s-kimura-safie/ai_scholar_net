import React from 'react'
import "./Login.css"
import { useContext, useRef } from 'react';
import { loginCall } from '../../states/ActionCalls';
import { AuthContext } from '../../states/AuthContext';
import { Link } from 'react-router-dom';


function Login() {
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

    console.log(user);

    return (
        <div className="login"> {
            <div className="loginWrapper">
                <div className="loginLeft">

                    <h3 className='loginLogo'>AI Scholar Net</h3>
                    <span className="loginDesc">AIによるAI開発者のためのAIの論文集</span>
                </div>
                <div className="loginRight">
                    <form className="loginBox" onSubmit={(e) => handleSubmit(e)}>
                        <p className='loginMsg'>アカウント情報を入力してください</p>
                        <input type="email" placeholder="メールアドレス" className="loginInput" required ref={email} autocomplete="email"/>
                        <input type="password" placeholder="パスワード" className="loginInput" minLength="6" ref={password} autocomplete="current-password"/>
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
