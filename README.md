
アプリルート, frontend, backend それぞれでパッケージをインストール
``` bash
npm install
```

`/backend` に `.env` を作成して、MongoDB と CoreAI のトークンを記入
`/frontend` に `.env` を作成して、サーバーのホストを記入

## 実行方法
`/frontend` で
``` bash
npm run build
```

`/backend` で
``` bash
node server.js
```
