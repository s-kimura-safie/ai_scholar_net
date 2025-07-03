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
            timeout: 45000, // タイムアウトを45秒に延長
            maxRedirects: 5, // リダイレクトを許可
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        // Content-TypeがPDFかチェック
        const contentType = response.headers['content-type'];
        if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
            throw new Error(`Invalid content type: ${contentType}`);
        }

        const fileName = `${Date.now()}-${path.basename(pdfUrl).split('?')[0]}.pdf`;
        const filePath = path.join(outputDir, fileName);

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                // ファイルサイズをチェック
                const stats = fs.statSync(filePath);
                if (stats.size < 1000) { // 1KB未満の場合はエラーとみなす
                    fs.unlinkSync(filePath);
                    reject(new Error('Downloaded file is too small, likely an error page'));
                } else {
                    resolve(filePath);
                }
            });
            writer.on('error', (error) => {
                // ファイルが作成されていれば削除
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(error);
            });

            // タイムアウト処理
            setTimeout(() => {
                writer.destroy();
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(new Error('Download timeout'));
            }, 60000); // 60秒でタイムアウト
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
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        const page = await browser.newPage();

        // User-Agentを設定してボット検出を回避
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ビューポートを設定
        await page.setViewport({ width: 1920, height: 1080 });

        // 固有のファイル名を生成
        const fileName = `${Date.now()}-${path.basename(pdfUrl).split('?')[0]}.pdf`;
        const filePath = path.join(outputDir, fileName);

        // ダウンロードディレクトリを設定
        const client = await page.createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: outputDir,
        });

        // ダウンロード完了を監視
        let downloadCompleted = false;
        const downloadPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (!downloadCompleted) {
                    reject(new Error('Download timeout'));
                }
            }, 45000); // 45秒のタイムアウト

            client.on('Page.downloadProgress', (event) => {
                if (event.state === 'completed') {
                    downloadCompleted = true;
                    clearTimeout(timeout);
                    resolve(event.guid);
                } else if (event.state === 'canceled') {
                    clearTimeout(timeout);
                    reject(new Error('Download was canceled'));
                }
            });
        });

        // リクエストインターセプトを無効化（ダウンロードの妨げになる可能性があるため）
        await page.setRequestInterception(false);

        try {
            // PDF URL にアクセス
            const response = await page.goto(pdfUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // レスポンスがPDFかチェック
            const contentType = response.headers()['content-type'];
            if (contentType && contentType.includes('application/pdf')) {
                // 直接PDFの場合は、レスポンスからバッファを取得
                const buffer = await response.buffer();
                await fs.writeFile(filePath, buffer);
                await browser.close();
                browser = null;
                return filePath;
            }

            // HTMLページの場合はダウンロードリンクを探す
            await page.waitForTimeout(3000);

            // ダウンロードが開始されるまで待機
            await Promise.race([downloadPromise, new Promise(resolve => setTimeout(resolve, 10000))]);

        } catch (downloadError) {
            console.warn('Download monitoring failed, trying fallback method:', downloadError.message);
        }

        await browser.close();
        browser = null;

        // ダウンロードされた PDF を取得
        await new Promise(resolve => setTimeout(resolve, 2000)); // 少し待機
        const files = await fs.readdir(outputDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            throw new Error('PDFファイルがダウンロードされませんでした');
        }

        // 最新のPDFファイルを取得
        const latestPdf = pdfFiles.reduce((latest, current) => {
            const latestStat = fs.statSync(path.join(outputDir, latest));
            const currentStat = fs.statSync(path.join(outputDir, current));
            return currentStat.mtime > latestStat.mtime ? current : latest;
        });

        return path.join(outputDir, latestPdf);
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
            console.log('Direct download successful');
        } catch (directError) {
            console.log('Direct download failed:', directError.message);
            console.log('Trying Puppeteer download...');
            try {
                // 直接ダウンロードが失敗した場合、Puppeteerを使用
                pdfLocalPath = await savePdf(pdfUrl, outputDir);
                console.log('Puppeteer download successful');
            } catch (puppeteerError) {
                console.log('Puppeteer download failed:', puppeteerError.message);
                // 最後の手段として、URLが直接PDFの場合はaxiosで再試行
                if (pdfUrl.endsWith('.pdf') || pdfUrl.includes('pdf')) {
                    console.log('Trying final fallback download...');
                    try {
                        const response = await axios.get(pdfUrl, {
                            responseType: 'arraybuffer',
                            timeout: 60000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });

                        const fileName = `${Date.now()}-fallback.pdf`;
                        const filePath = path.join(outputDir, fileName);
                        await fs.writeFile(filePath, response.data);
                        pdfLocalPath = filePath;
                        console.log('Fallback download successful');
                    } catch (fallbackError) {
                        throw new Error(`All download methods failed. Last error: ${fallbackError.message}`);
                    }
                } else {
                    throw new Error(`All download methods failed. Puppeteer error: ${puppeteerError.message}`);
                }
            }
        }

        const dataBuffer = await fs.readFile(pdfLocalPath);
        const data = await pdfParse(dataBuffer);

        console.log(`Successfully extracted PDF text from: ${pdfUrl}`);
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
