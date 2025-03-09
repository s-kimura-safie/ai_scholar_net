import React from 'react'
import "./Login.css"
import { useContext, useRef } from 'react';
import { loginCall } from '../../ActionCalls';
import { AuthContext } from '../../states/AuthContext';

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

                    <h3 className='loginLogo'>Real SNS</h3>
                    <span className="loginDesc">本格的なSNSを自分の手で</span>
                </div>
                <div className="loginRight">
                    <form className="loginBox" onSubmit={(e) => handleSubmit(e)}>
                        <p className='loginMsg'>ログインはこちら</p>
                        <input type="email" placeholder="メールアドレス" className="loginInput" required ref={email} />
                        <input type="password" placeholder="パスワード" className="loginInput" minLength="6" ref={password} />
                        <button className='loginButton'>ログイン</button>
                        <span className="loginForgot">パスワードを忘れた方はこちら</span>
                        <button className="loginRegisterButton">アカウント作成</button>
                    </form>
                </div>
            </div>
        }
        </div>
    )
}

export default Login
