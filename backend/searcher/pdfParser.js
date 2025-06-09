import fs from 'fs';
import { createRequire } from 'module'; // CommonJSモジュールを使用するためのrequire関数を作成
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');


// PDFからテキストを抽出する関数
export async function extractPdfText(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`指定されたPDFファイルが見つかりません: ${filePath}`);
    }
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

export default extractPdfText;
