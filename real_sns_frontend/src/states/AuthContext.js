import { createContext, useReducer, useEffect } from 'react';
import AuthReducer from './AuthReducer';

// 最初のユーザー状態を定義
const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null, // ローカルストレージにユーザー情報があれば取得
    isFetching: false,
    error: false,
};

// 状態をグローバルで管理する。
export const AuthContext = createContext(initialState);

export const AuthcontextProvider = ({ children }) => { // childrenはAppコンポーネント
    const [state, dispatch] = useReducer(AuthReducer, initialState);

    useEffect(() => {
        localStorage.setItem("user", JSON.stringify(state.user)); // ユーザー情報をローカルストレージに保存
    }, [state.user]); // state.user が変更された時だけ実行

    return (
        <AuthContext.Provider value={{
            user: state.user,
            isFetching: state.isFetching,
            error: state.error,
            dispatch
        }}>
            {children}
        </AuthContext.Provider>
    );
}
