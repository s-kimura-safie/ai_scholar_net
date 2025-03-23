// Router:express.Router()は、Express.jsのルーティング機能をモジュール化するためのミドルウェア
const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// アップロード先ディレクトリ
const uploadPath = path.join(__dirname, "../public/images");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Multerの設定（メモリに一時保存）
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Image upload API
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filename = req.body.name || `${Date.now()}-${req.file.originalname}`;
        const outputPath = path.join(uploadPath, filename);

        // Sharpで画像を圧縮・リサイズ
        await sharp(req.file.buffer)
            .resize({ width: 800 }) // 幅を800pxにリサイズ（高さは自動調整）
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .jpeg({ quality: 80 }) // JPEG形式で圧縮（品質80%）
            .toFile(outputPath);

        return res.status(200).json({ message: "Image uploaded successfully", filename });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to process image" });
    }
});

module.exports = router;
