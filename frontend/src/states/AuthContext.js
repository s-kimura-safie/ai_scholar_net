import { createContext, useReducer, useEffect } from 'react';
import AuthReducer from './AuthReducer';

// 最初のユーザー状態を定義
const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null, // ローカルストレージにユーザー情報があれば取得
    isFetching: false,
    error: false,
    searchKeyword: "", // 検索キーワードの初期値
};

// 状態をグローバルで管理する。
export const AuthContext = createContext(initialState);

export const AuthcontextProvider = ({ children }) => { // childrenはAppコンポーネント
    const [state, dispatch] = useReducer(AuthReducer, initialState);

    useEffect(() => {
        if (state.user) {
            // パスワードを除外して保存
            const { password, ...userWithoutPassword } = state.user;
            localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        } else {
            localStorage.removeItem("user"); // ユーザーが null の場合はローカルストレージから削除
        }
    }, [state.user]); // state.user が変更された時だけ実行

    return (
        <AuthContext.Provider value={{
            user: state.user,
            isFetching: state.isFetching,
            error: state.error,
            searchKeyword: state.searchKeyword,
            dispatch
        }}>
            {children}
        </AuthContext.Provider>
    );
}
