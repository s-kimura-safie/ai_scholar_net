import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        max: 200,
    },
    img: {
        type: String,
    },
    likes: {
        type: Array,
        default: [],
    },
    comments: [
        {
            userId: { type: String, required: true },
            username: { type: String, required: true },
            text: { type: String, required: true },
        },
    ],
    paperId: {
        type: String,
        required: false, // 論文が関連付けられていない投稿も許容
    },
}, { timestamps: true });

export default mongoose.model("Post", PostSchema);
