import React from 'react'
import "./Register.css"
import { useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {

    const username = useRef();
    const email = useRef(); // useRefを使ってemailの要素を監視する。
    const password = useRef();
    const passwordConfirm = useRef();

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // ページがリロードされるのを防ぐ

        // パスワードと確認用パスワードが一致しているかチェック
        if (password.current.value !== passwordConfirm.current.value) {
            passwordConfirm.current.setCustomValidity("パスワードが一致しません");
        } else {
            try {
                // register api call
                const user = {
                    username: username.current.value,
                    email: email.current.value,
                    password: password.current.value
                }
                console.log(user);

                await axios.post("/auth/register", user)
                navigate("/login");
            }
            catch (err) {
                console.log(err);
            }
        }
    }



    return (
        <div className="login"> {
            <div className="loginWrapper">
                <div className="loginLeft">

                    <h3 className='loginLogo'>AI Scholar Net</h3>
                    <span className="loginDesc">AIによるAIの論文集</span>
                </div>
                <div className="loginRight">
                    <form className="loginBox" onSubmit={(e) => handleSubmit(e)}>
                        <p className='loginMsg'>新規登録はこちら</p>
                        <input type="text" placeholder="ユーザー名" className="loginInput" required ref={username}/>
                        <input type="email" placeholder="メールアドレス" className="loginInput" required ref={email} />
                        <input type="password" placeholder="パスワード" className="loginInput" minLength="6" required ref={password} />
                        <input type="password" placeholder="確認用パスワード" className="loginInput" minLength="6" required ref={passwordConfirm} />
                        <button type="submit" className='loginButton'>サインアップ</button>
                        <button type="submit" className="loginRegisterButton">ログイン</button>
                    </form>
                </div>
            </div>
        }
        </div >
    )
}

export default Register
