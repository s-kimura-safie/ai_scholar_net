import React from 'react'
import "./Register.css"
import { useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
    const PUBLIC_FOLDER = process.env.REACT_APP_PUBLIC_FOLDER;
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

                await axios.post("/api/auth/register", user)
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
                    <img src = {PUBLIC_FOLDER + "/icons/SchalAI_san.png"} alt="" className="logoImg"/>
                    <h3 className='registerLogo'>ScholAI</h3>
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
                    <div className="toLoginPage">アカウントをお持ちの方は
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <span className="pathLoginPage">こちら</span>
                        </Link>
                    </div>
                </div>
            </div>
        }
        </div >
    )
}

export default Register
