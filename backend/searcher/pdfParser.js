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
        console.log(`Starting direct download from: ${pdfUrl}`);

        const response = await axios({
            method: 'GET',
            url: pdfUrl,
            responseType: 'arraybuffer',
            timeout: 90000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://academic.oup.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 400; // 3xxリダイレクトも許可
            }
        });

        // Content-TypeがPDFかチェック
        const contentType = response.headers['content-type'] || '';
        console.log(`Content-Type: ${contentType}`);

        if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream') && !contentType.includes('binary/octet-stream')) {
            throw new Error(`Invalid content type: ${contentType}`);
        }

        // レスポンスデータを確認
        if (!response.data || response.data.byteLength < 1000) {
            throw new Error('Downloaded file is too small, likely an error page');
        }

        // PDFの署名をチェック（%PDF）
        const buffer = Buffer.from(response.data);
        const pdfSignature = buffer.slice(0, 4).toString();
        console.log(`File signature: ${pdfSignature}`);

        if (!pdfSignature.startsWith('%PDF')) {
            // HTMLファイルかどうかチェック
            const content = buffer.toString('utf8', 0, 1000);
            if (content.includes('<html') || content.includes('<!DOCTYPE')) {
                throw new Error('Downloaded file is HTML, not PDF');
            }
            console.warn('File does not have PDF signature but proceeding...');
        }

        const fileName = `${Date.now()}-${path.basename(pdfUrl).split('?')[0]}.pdf`;
        const filePath = path.join(outputDir, fileName);

        await fs.writeFile(filePath, buffer);

        // ファイルサイズを再確認
        const stats = await fs.stat(filePath);
        console.log(`Downloaded file size: ${stats.size} bytes`);

        if (stats.size < 1000) {
            await fs.unlink(filePath);
            throw new Error('Downloaded file is too small, likely an error page');
        }

        return filePath;
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
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        const page = await browser.newPage();

        // より詳細なUser-Agentを設定
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 追加のヘッダーを設定
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://academic.oup.com/',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Upgrade-Insecure-Requests': '1'
        });

        // JavaScriptを有効化
        await page.setJavaScriptEnabled(true);

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
        let downloadError = null;
        const downloadPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (!downloadCompleted) {
                    downloadError = new Error('Download timeout');
                    reject(downloadError);
                }
            }, 120000); // タイムアウトを120秒に延長

            client.on('Page.downloadProgress', (event) => {
                if (event.state === 'completed') {
                    downloadCompleted = true;
                    clearTimeout(timeout);
                    resolve(event.guid);
                } else if (event.state === 'canceled') {
                    downloadError = new Error('Download was canceled');
                    clearTimeout(timeout);
                    reject(downloadError);
                }
            });
        });

        try {
            // まず基本ページにアクセスしてCookieを取得
            const baseUrl = new URL(pdfUrl).origin;
            await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.waitForTimeout(2000);

            // PDF URL にアクセス
            console.log('Navigating to PDF URL with Puppeteer...');
            const response = await page.goto(pdfUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 45000
            });

            // レスポンスの詳細をログ出力
            console.log('Response status:', response.status());
            console.log('Response headers:', response.headers());

            const contentType = response.headers()['content-type'] || '';
            console.log('Content-Type from Puppeteer:', contentType);

            // レスポンスがPDFかチェック
            if (contentType.includes('application/pdf')) {
                console.log('Direct PDF response detected');
                const buffer = await response.buffer();
                await fs.writeFile(filePath, buffer);
                await browser.close();
                browser = null;
                return filePath;
            }

            // HTMLページの場合、PDFダウンロードリンクを探す
            console.log('HTML page detected, looking for PDF download options...');
            await page.waitForTimeout(5000);

            // 複数のダウンロード戦略を試行
            const downloadStrategies = [
                // 戦略1: PDFビューアーのiframeを探す
                async () => {
                    const iframes = await page.$$('iframe');
                    for (const iframe of iframes) {
                        const src = await iframe.evaluate(el => el.src);
                        if (src && src.includes('pdf')) {
                            console.log('Found PDF iframe:', src);
                            await page.goto(src, { waitUntil: 'domcontentloaded' });
                            const iframeResponse = await page.goto(src);
                            if (iframeResponse.headers()['content-type']?.includes('application/pdf')) {
                                const buffer = await iframeResponse.buffer();
                                await fs.writeFile(filePath, buffer);
                                return true;
                            }
                        }
                    }
                    return false;
                },

                // 戦略2: PDF直接リンクを探す
                async () => {
                    const pdfLinks = await page.$$eval('a[href*="pdf"], a[href*=".pdf"]', links =>
                        links.map(link => link.href).filter(href => href && href.includes('pdf'))
                    );

                    for (const link of pdfLinks) {
                        console.log('Trying PDF link:', link);
                        try {
                            const linkResponse = await page.goto(link, { waitUntil: 'domcontentloaded' });
                            if (linkResponse.headers()['content-type']?.includes('application/pdf')) {
                                const buffer = await linkResponse.buffer();
                                await fs.writeFile(filePath, buffer);
                                return true;
                            }
                        } catch (e) {
                            console.log('PDF link failed:', e.message);
                        }
                    }
                    return false;
                },

                // 戦略3: ダウンロードボタンをクリック
                async () => {
                    const downloadSelectors = [
                        'a[href*="pdf"]',
                        'button[title*="PDF"]',
                        'a[title*="PDF"]',
                        '.pdf-download',
                        '[data-download-type="pdf"]'
                    ];

                    for (const selector of downloadSelectors) {
                        try {
                            const element = await page.$(selector);
                            if (element) {
                                console.log(`Clicking download element: ${selector}`);
                                await element.click();
                                await page.waitForTimeout(3000);
                                // ダウンロードが開始されたかチェック
                                const files = await fs.readdir(outputDir);
                                const newPdfFiles = files.filter(f => f.endsWith('.pdf') && f.includes(Date.now().toString().substring(0, 10)));
                                if (newPdfFiles.length > 0) {
                                    return true;
                                }
                            }
                        } catch (e) {
                            console.log(`Download strategy failed for ${selector}:`, e.message);
                        }
                    }
                    return false;
                }
            ];

            // 各戦略を順番に試行
            for (let i = 0; i < downloadStrategies.length; i++) {
                console.log(`Trying download strategy ${i + 1}...`);
                const success = await downloadStrategies[i]();
                if (success) {
                    console.log(`Download strategy ${i + 1} succeeded`);
                    break;
                }
            }

            // ダウンロードが開始されるまで待機
            await Promise.race([downloadPromise, new Promise(resolve => setTimeout(resolve, 15000))]);

        } catch (err) {
            console.warn('Puppeteer navigation/download failed:', err.message);
        }

        // 監視エラー時も、ダウンロードディレクトリにPDFが落ちていないか再確認
        await browser.close();
        browser = null;

        await new Promise(resolve => setTimeout(resolve, 2000)); // 少し待機
        const files = await fs.readdir(outputDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            if (downloadError) {
                throw downloadError;
            }
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

// 学術サイト用の特別なダウンロード戦略
async function downloadFromAcademicSite(pdfUrl, outputDir) {
    let browser;
    try {
        console.log('Trying academic site specific download strategy...');

        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();

        // より実際のブラウザに近い設定
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        // JavaScriptを有効にしてウェブページのスクリプトも実行
        await page.setJavaScriptEnabled(true);

        // 必要に応じてページを段階的に読み込み
        if (pdfUrl.includes('academic.oup.com')) {
            // Oxford Academic用の特別な処理
            console.log('Detected Oxford Academic, using specific strategy...');

            // まずarticleページにアクセス
            const articleUrl = pdfUrl.replace('/article-pdf/', '/article/').split('/')[0] + '//' + pdfUrl.split('//')[1].split('/').slice(0, -1).join('/');

            try {
                await page.goto(articleUrl, { waitUntil: 'networkidle0', timeout: 30000 });
                await page.waitForTimeout(3000);

                // PDF ダウンロードリンクを探す
                const pdfDownloadLink = await page.$eval('a[href*="article-pdf"], .al-link[href*="pdf"]', el => el.href).catch(() => null);

                if (pdfDownloadLink) {
                    console.log('Found PDF download link:', pdfDownloadLink);
                    const response = await page.goto(pdfDownloadLink, { waitUntil: 'domcontentloaded' });

                    if (response.headers()['content-type']?.includes('application/pdf')) {
                        const buffer = await response.buffer();
                        const fileName = `${Date.now()}-oxford.pdf`;
                        const filePath = path.join(outputDir, fileName);
                        await fs.writeFile(filePath, buffer);
                        return filePath;
                    }
                }
            } catch (e) {
                console.log('Oxford specific strategy failed:', e.message);
            }
        }

        // 一般的な戦略：直接PDFにアクセス
        console.log('Trying direct PDF access...');
        const response = await page.goto(pdfUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 45000
        });

        // Content-Typeをチェック
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/pdf')) {
            const buffer = await response.buffer();
            const fileName = `${Date.now()}-direct.pdf`;
            const filePath = path.join(outputDir, fileName);
            await fs.writeFile(filePath, buffer);
            return filePath;
        }

        // HTMLが返された場合、5秒待ってからPDFに変換されるかチェック
        await page.waitForTimeout(5000);

        // ページ内のPDFリンクを探す
        const pdfLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, iframe'));
            return links.map(link => {
                const href = link.href || link.src;
                if (href && (href.includes('.pdf') || href.includes('pdf'))) {
                    return href;
                }
                return null;
            }).filter(Boolean);
        });

        for (const link of pdfLinks) {
            try {
                console.log('Trying PDF link found in page:', link);
                const linkResponse = await page.goto(link, { waitUntil: 'domcontentloaded' });
                if (linkResponse.headers()['content-type']?.includes('application/pdf')) {
                    const buffer = await linkResponse.buffer();
                    const fileName = `${Date.now()}-found.pdf`;
                    const filePath = path.join(outputDir, fileName);
                    await fs.writeFile(filePath, buffer);
                    return filePath;
                }
            } catch (e) {
                console.log('PDF link failed:', e.message);
            }
        }

        throw new Error('No valid PDF found using academic site strategy');

    } finally {
        if (browser) {
            await browser.close();
        }
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

            // 学術サイト用の特別な戦略を試行
            try {
                console.log('Trying academic site specific strategy...');
                pdfLocalPath = await downloadFromAcademicSite(pdfUrl, outputDir);
                console.log('Academic site strategy successful');
            } catch (academicError) {
                console.log('Academic site strategy failed:', academicError.message);
                console.log('Trying Puppeteer download...');

                try {
                    // 通常のPuppeteer戦略を使用
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
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                    'Referer': 'https://academic.oup.com/',
                                    'Accept': 'application/pdf,*/*'
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
        }

        // PDFファイルの有効性をチェック
        const dataBuffer = await fs.readFile(pdfLocalPath);

        // ファイルサイズをチェック
        if (dataBuffer.length < 100) {
            throw new Error('Downloaded file is too small to be a valid PDF');
        }

        // PDFファイルの先頭を確認（PDF magic number）
        const pdfHeader = dataBuffer.slice(0, 4).toString();
        console.log(`PDF file header: ${pdfHeader}`);

        if (!pdfHeader.startsWith('%PDF')) {
            // HTMLファイルかどうかチェック
            const content = dataBuffer.toString('utf8', 0, 2000); // より多くの内容を確認
            if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<template')) {
                // HTMLのタイトルやbodyの一部もログ出力
                const htmlTitleMatch = content.match(/<title>(.*?)<\/title>/i);
                const htmlTitle = htmlTitleMatch ? htmlTitleMatch[1] : '';
                const htmlBodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                const htmlBody = htmlBodyMatch ? htmlBodyMatch[1].slice(0, 300) : '';

                console.error('Downloaded file is HTML, not PDF. URL:', pdfUrl);
                console.error('File size:', dataBuffer.length, 'bytes');
                console.error('Content preview (first 500 chars):', content.slice(0, 500));
                if (htmlTitle) console.error('HTML Title:', htmlTitle);
                if (htmlBody) console.error('HTML Body (first 300 chars):', htmlBody);

                // 可能であれば、HTMLからPDFの実際のURLを抽出を試行
                const pdfLinkMatch = content.match(/href=["']([^"']*\.pdf[^"']*)/i);
                if (pdfLinkMatch) {
                    console.log('Found potential PDF link in HTML:', pdfLinkMatch[1]);
                }

                throw new Error(`Downloaded file is HTML, not PDF. Possible reasons:
                1. URL requires authentication or cookies
                2. URL redirects to a landing page
                3. PDF is served through JavaScript
                4. Access is restricted by IP or user-agent
                Original URL: ${pdfUrl}`);
            }

            // バイナリファイルがJPEGやPNGでないかチェック
            if (dataBuffer[0] === 0xFF && dataBuffer[1] === 0xD8) {
                throw new Error('Downloaded file is JPEG image, not PDF');
            }
            if (dataBuffer[0] === 0x89 && dataBuffer[1] === 0x50) {
                throw new Error('Downloaded file is PNG image, not PDF');
            }

            console.warn('File does not appear to be a valid PDF, but attempting to parse...');
        }

        console.log('Attempting to parse PDF...');
        const data = await pdfParse(dataBuffer, {
            // PDFパースオプションを追加
            max: 0, // 最大ページ数の制限を無効化
            version: 'v1.10.100' // PDFバージョンを指定
        });

        console.log(`Successfully extracted PDF text from: ${pdfUrl}`);

        if (data.text.length < 50) {
            console.warn('Extracted text is very short, PDF might be image-based or empty');
        }

        return data.text;
    } catch (error) {
        console.error(`PDF extraction failed for ${pdfUrl}:`, error.message);

        // ダウンロードしたファイルの内容をデバッグのために確認
        if (pdfLocalPath && await fs.pathExists(pdfLocalPath)) {
            try {
                const buffer = await fs.readFile(pdfLocalPath);
                const preview = buffer.slice(0, 200).toString('utf8');
                console.log('File preview (first 200 chars):', preview);
                console.log('File size:', buffer.length, 'bytes');

                // バイナリ形式での先頭バイトを表示
                const hexPreview = buffer.slice(0, 16).toString('hex');
                console.log('File hex preview:', hexPreview);
            } catch (previewError) {
                console.log('Could not read file for preview:', previewError.message);
            }
        }

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
