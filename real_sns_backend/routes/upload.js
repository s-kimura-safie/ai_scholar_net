// Router:express.Router()は、Express.jsのルーティング機能をモジュール化するためのミドルウェア
const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
    },
    filename: (req, file, cb) => {
        cb(null, req.body.name);
    },
});

const upload = multer({ storage });

// Image upload API
router.post("/", upload.single("file"), (req, res) => {
    try {
        return res.status(200).json("Image upload API");
    }
    catch (err) {
        console.log(err);
    }
});


module.exports = router;
