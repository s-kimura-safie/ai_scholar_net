import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            min: 3,
            max: 20,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            max: 50,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            min: 6,
            max: 500,
        },
        profilePicture: {
            type: String,
            default: "",
        },
        coverPicture: {
            type: String,
            default: "",
        },
        followers: {
            type: Array,
            default: [],
        },
        followings: {
            type: Array,
            default: [],
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        desc: {
            type: String,
            max: 70,
        },
        origin: {
            type: String,
            max: 50,
            default: ""
        },
        hobby: {
            type: String,
            max: 50,
            default: ""
        },
        bio: {
            type: String,
            max: 50,
            default: ""
        },
    },

    { timestamps: true }
);


export default mongoose.model("User", UserSchema);
