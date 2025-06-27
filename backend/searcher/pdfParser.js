import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from "path";
import axios from 'axios';

const require = createRequire(import.meta.url);
import { createRequire } from 'module';
import { fileURLToPath } from "url";
const pdfParse = require('pdf-parse');

// __dirname の代替設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Axiosを使った直接PDFダウンロード（代替手段）
async function downloadPdfDirect(pdfUrl, outputDir) {
    try {
        const response = await axios({
            method: 'GET',
            url: pdfUrl,
            responseType: 'stream',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const fileName = `${Date.now()}-${path.basename(pdfUrl).split('?')[0]}.pdf`;
        const filePath = path.join(outputDir, fileName);

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Direct PDF download failed: ${error.message}`);
    }
}

// Puppeteer で PDF をダウンロード
async function savePdf(pdfUrl, outputDir) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();

        // User-Agentを設定してボット検出を回避
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ビューポートを設定
        await page.setViewport({ width: 1920, height: 1080 });

        // ダウンロードディレクトリを設定
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: outputDir,
        });

        // リクエストインターセプトでエラーハンドリング
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
                req.abort();
            } else {
                req.continue();
            }
        });

        // PDF URL にアクセス（タイムアウトとエラーハンドリングを追加）
        await page.goto(pdfUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // ダウンロード完了まで待機
        await new Promise((res) => setTimeout(res, 8000));

        await browser.close();
        browser = null;

        // ダウンロードされた PDF を取得（最初に見つかったPDFファイル）
        const files = await fs.readdir(outputDir);
        const pdfFile = files.find((f) => f.endsWith('.pdf'));
        if (!pdfFile) throw new Error('PDFファイルがダウンロードされませんでした');

        return path.join(outputDir, pdfFile);
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw new Error(`PDF download failed: ${error.message}`);
    }
}

// PDFからテキストを抽出する関数
export async function extractPdfText(pdfUrl) {
    let pdfLocalPath;
    try {
        const outputDir = path.resolve(__dirname, '../public/pdfs');
        await fs.ensureDir(outputDir);

        // まず直接ダウンロードを試行
        try {
            console.log('Trying direct PDF download...');
            pdfLocalPath = await downloadPdfDirect(pdfUrl, outputDir);
        } catch (directError) {
            console.log('Direct download failed, trying Puppeteer...');
            // 直接ダウンロードが失敗した場合、Puppeteerを使用
            pdfLocalPath = await savePdf(pdfUrl, outputDir);
        }

        const dataBuffer = await fs.readFile(pdfLocalPath);
        const data = await pdfParse(dataBuffer);

        console.log(`Successfully downloaded PDF using Puppeteer`);
        return data.text;
    } catch (error) {
        console.error(`PDF extraction failed for ${pdfUrl}:`, error.message);
        throw error;
    } finally {
        // PDFファイルのクリーンアップ
        if (pdfLocalPath && await fs.pathExists(pdfLocalPath)) {
            try {
                await fs.remove(pdfLocalPath);
            } catch (cleanupError) {
                console.warn(`Failed to cleanup PDF file ${pdfLocalPath}:`, cleanupError.message);
            }
        }
    }
}

export default extractPdfText;
