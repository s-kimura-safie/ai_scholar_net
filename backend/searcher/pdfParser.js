import fs from 'fs';
import path from "path";
import axios from 'axios';
const require = createRequire(import.meta.url);
import { createRequire } from 'module';
import { fileURLToPath } from "url";
const pdfParse = require('pdf-parse');


// __dirname の代替設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDFを保存する関数
async function savePdf(pdfPath, outputDir) {
    const pdfFileName = `temp.pdf`;
    const pdfFilePath = path.join(outputDir, pdfFileName);

    const response = await axios.get(pdfPath, { responseType: 'stream' });
    if (response.status !== 200) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(pdfFilePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return pdfFilePath;
}

// PDFからテキストを抽出する関数
export async function extractPdfText(pdfPath) {
    const pdfLocalPath = await savePdf(pdfPath, path.resolve(__dirname, '../public/pdfs'));

    // PDFファイルを読み込み、テキストを抽出
    const dataBuffer = fs.readFileSync(pdfLocalPath);
    const data = await pdfParse(dataBuffer);

    fs.unlinkSync(pdfLocalPath); // 一時保存したpdfファイルを削除

    return data.text;
}

export default extractPdfText;
