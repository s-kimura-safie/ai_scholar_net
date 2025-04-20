const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                user: null,
                isFetching: true,
                error: false,
                searchKeyword: state.searchKeyword, // 検索キーワードは保持
            };
        case "LOGIN_SUCCESS":
            return {
                user: action.payload,
                isFetching: false,
                error: false,
                searchKeyword: state.searchKeyword, // 検索キーワードは保持
            };
        case "LOGIN_ERROR":
            return {
                user: null,
                isFetching: false,
                error: action.payload,
                searchKeyword: state.searchKeyword, // 検索キーワードは保持
            };
        case "LOGOUT":
            return {
                user: null,
                isFetching: false,
                error: false,
                searchKeyword: "", // 検索キーワードをリセット
            };
        case "SET_SEARCH_KEYWORD": // 検索キーワードを更新するアクション
            return {
                ...state,
                searchKeyword: action.payload,
            };
        default:
            return state;
    }
};

export default AuthReducer;
