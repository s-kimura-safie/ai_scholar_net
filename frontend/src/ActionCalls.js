import axios from 'axios';

export const loginCall = async (user, dispatch) => {
    dispatch({ type: "LOGIN_START" });
    try {
        const response = await axios.post("/auth/login", user);
        dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
    }
    catch (err) {
        dispatch({ type: "LOGIN_FAILURE", payload: err });
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
