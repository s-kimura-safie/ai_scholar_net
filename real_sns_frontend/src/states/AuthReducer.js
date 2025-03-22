const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                user: null,
                isFetching: true,
                error: false,
            };
        case "LOGIN_SUCCESS":
            return {
                user: action.payload,
                isFetching: false,
                error: false,
            };
        case "LOGIN ERROR":
            return {
                user: null,
                isFetching: false,
                error: action.payload,
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
