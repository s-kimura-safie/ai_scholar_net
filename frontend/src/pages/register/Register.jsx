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
        <div className="register"> {
            <div className="registerWrapper">
                <div className="registerLeft">

                    <h3 className='registerLogo'>AI Scholar Net</h3>
                    <span className="registerDesc">AIによるAIの論文集</span>
                </div>
                <div className="registerRight">
                    <form className="registerBox" onSubmit={(e) => handleSubmit(e)}>
                        <p className='registerMsg'>新規登録はこちら</p>
                        <input type="text" placeholder="ユーザー名" className="registerInput" required ref={username} />
                        <input type="email" placeholder="メールアドレス" className="registerInput" required ref={email} />
                        <input type="password" placeholder="パスワード" className="registerInput" minLength="6" required ref={password} />
                        <input type="password" placeholder="確認用パスワード" className="registerInput" minLength="6" required ref={passwordConfirm} />
                        <button type="submit" className='registerButton'>サインアップ</button>
                    </form>
                    <button type="submit" className="loginRegisterButton">ログイン</button>
                </div>
            </div>
        }
        </div >
    )
}

export default Register
