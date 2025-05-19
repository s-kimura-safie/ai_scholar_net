import axios from 'axios';

export const loginCall = async (user, dispatch) => {
    dispatch({ type: "LOGIN_START" });
    try {
        const response = await axios.post("api/auth/login", user);
        dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
    }
    catch (err) {
        // エラーメッセージを取得
        const errorMessage = err.response?.data || "ログインに失敗しました";
        // エラーメッセージを画面に表示
        alert(errorMessage);
        dispatch({ type: "LOGIN_ERROR", payload: err });
    }
}

export const logoutCall = async (dispatch) => {
    try {
        // ローカルストレージからユーザー情報を完全に削除
        localStorage.removeItem("user");
        // LOGOUT アクションをディスパッチ
        dispatch({ type: "LOGOUT" });
        // 検索キーワードもリセット
        dispatch({ type: "SET_SEARCH_KEYWORD", payload: "" });
    } catch (err) {
        console.error("ログアウト処理中にエラーが発生しました:", err);
    }
}
