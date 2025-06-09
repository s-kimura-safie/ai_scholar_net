import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import summarizer from "../searcher/summarizer.js";
import parcePdf from "../searcher/pdfParser.js";

const router = Router();

// __dirname の代替設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保存先ディレクトリを用途ごとに分岐
const profilePath = path.join(__dirname, "../public/images/profile");
const postPath = path.join(__dirname, "../public/images/post");
if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
}
if (!fs.existsSync(postPath)) {
    fs.mkdirSync(postPath, { recursive: true });
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
        // 用途判定: req.body.type で "profile" or "cover" or "post" を受け取る想定
        let outputDir;
        if (req.body.type === "profile" || req.body.type === "cover") {
            outputDir = profilePath;
        } else if (req.body.type === "post") {
            outputDir = postPath;
        } else {
            // デフォルトはpost画像
            outputDir = postPath;
        }
        const outputPath = path.join(outputDir, filename);

        // Sharpで画像を圧縮・リサイズ
        await sharp(req.file.buffer)
            .resize({ width: 800 })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

        // クライアントに保存先種別も返す
        return res.status(200).json({ message: "Image uploaded successfully", filename, type: req.body.type });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to process image" });
    }
});

// PDF upload and summarize API
const pdfUploadPath = path.join(__dirname, "../public/pdfs");
const pdfUpload = multer({
    storage: multer.diskStorage({
        destination: pdfUploadPath,
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    }),
    fileFilter: (req, file, cb) => cb(null, path.extname(file.originalname).toLowerCase() === ".pdf")
});

router.post("/upload-paper", pdfUpload.single("file"), async (req, res) => {
    try {
        const textScholar = await parcePdf(req.file.path);
        console.log('✅ PDFからテキストを抽出しました。');
        const summary = await summarizer(textScholar);
        res.status(200).json({ summary });
    } catch (error) {
        console.error("Error summarizing paper:", error);
        res.status(500).json({ error: "Failed to summarize paper" });
    }
});

export default router;
