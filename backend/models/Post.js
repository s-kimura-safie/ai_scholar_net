const mongoose = require("mongoose");

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
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
