## 環境構築
アプリルート, frontend, backend それぞれでパッケージをインストール
``` bash
npm install
```

`/backend` に `.env` を作成して、MongoDB と cohereAI のトークンを記入
`/frontend` に `.env` を作成して、サーバーのホストを記入

## 実行方法
### ローカルサーバーで実行する方法
`/frontend` で
``` bash
npm start
```

別のコンソールを開いて、
`/backend` で
``` bash
node server.js
```

### リモートサーバーで実行する方法
`/frontend` で
``` bash
npm run build
```

`/backend` で
``` bash
node server.js
```
