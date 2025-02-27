# ChainSillyTavern

[English Documentation](README.md) | [中文文档](README-zh.md)

![](2025-02-27-12-36-27.png)

![](2025-02-27-12-36-06.png)

## はじめに

ChainSillyTavernは、複数のSillyTavernサーバーインスタンスを作成、管理、および監視するために設計されたSillyTavernインスタンス管理システムです。システムはRESTful APIインターフェースとモダンな管理インターフェースを提供し、インスタンスの作成、停止、および削除などの操作をサポートします。

## ライセンス
このプロジェクトはAGPL-3.0の下でライセンスされています。

## クイックスタート

Node.jsがインストールされたLinuxサーバーが必要です。

### リポジトリのクローンまたはダウンロード

```bash
git clone https://github.com/easychen/CST.git
```

### 環境変数の設定
`factory-api/.env.example`を`factory-api/.env`にコピーし、`ADMIN_KEY`パスワードと`PORT`パラメータを変更します。

### SSL証明書の設定（オプション）

ドメイン証明書を`factory-api/certs`ディレクトリに配置します：

- 証明書：`factory-api/certs/cert.pem`
- 秘密鍵：`factory-api/certs/privkey.pem`

### PM2のグローバルインストール
```bash
npm install pm2 -g
```

### サービスの初期化と起動

> サーバーネットワークはGithubにアクセスできる必要があります。そうでない場合は、`init.sh`のリポジトリアドレスを変更してください。

```bash
bash init.sh
```

## プロジェクト構造

- `factory-api/`: バックエンドAPIサービス
- `cst/`: フロントエンド管理インターフェース
- `stsource-changed/`: 変更されたSTソースコード

## プロジェクトの初期化

`init.sh`を実行してSTコードをダウンロードし、変更されたバージョンを上書きします（コマンドライン基本パスワード入力をサポートするため）。

## 環境設定

### 前提条件

- Node.js（v14以上推奨）
- PM2（プロセスマネジメントツール）

### バックエンド設定

`factory-api/.env`ファイルに以下のパラメータを設定します：

```env
# 管理者キーの設定
ADMIN_KEY=your-secret-admin-key

# サーバーポートの設定
PORT=3000

# 環境設定
NODE_ENV=development
```

### フロントエンド設定

`cst/.env.development`ファイルにAPIアドレスを設定します：

```env
VITE_API_URL=http://localhost:3000
```

### SSL設定

SSLを有効にするには、以下のコマンドラインパラメータを使用します：

```bash
# SSLを有効にする
--ssl=true

# 証明書パスの設定
--certPath=certs/cert.pem     # 証明書ファイルパス
--keyPath=certs/privkey.pem   # 秘密鍵ファイルパス
```

## サービスの起動

### バックエンドAPIの起動

```bash
cd factory-api && npm run start
```

### フロントエンドインターフェースの起動

開発モード：
```bash
cd cst && npm run dev
```

本番環境：
```bash
cd cst && npm run build
```

## APIドキュメント

### 認証

すべてのAPIリクエストには、リクエストヘッダーに管理者キーが必要です：

```http
X-ST-Admin-Key: your-secret-admin-key
```

### SillyTavernインスタンスの作成

```http
POST /api/instances
Content-Type: application/json
X-ST-Admin-Key: your-secret-admin-key

{
    "port": 8001
}
```

レスポンス例：

```json
{
    "id": "st-instance-8001",
    "port": 8001,
    "dataDir": "/path/to/user-data/8001",
    "status": "running",
    "startTime": "2024-01-01T00:00:00.000Z",
    "password": "generated-uuid-for-basic-auth"
}
```

### すべてのインスタンスの取得

```http
GET /api/instances
X-ST-Admin-Key: your-secret-admin-key
```

レスポンス例：

```json
[
    {
        "id": "st-instance-8001",
        "port": 8001,
        "status": "online",
        "startTime": "2024-01-01T00:00:00.000Z",
        "dataDir": "/path/to/user-data/8001"
    }
]
```

### インスタンスの削除

```http
DELETE /api/instances/st-instance-8001
X-ST-Admin-Key: your-secret-admin-key
```

レスポンス例：

```json
{
    "message": "インスタンスが削除されました"
}
```

## エラーハンドリング

エラーが発生した場合、APIは適切なHTTPステータスコードとエラーメッセージを返します：

```json
{
    "error": "エラーメッセージ"
}
```

一般的なエラー：

- 400: リクエストパラメータエラー（例：ポート番号が欠落している）またはポートが既に使用されている
- 401: 管理者キーが欠落しているか無効な管理者キー
- 404: インスタンスが見つからない
- 500: サーバー内部エラー（例：インスタンスの作成に失敗、インスタンスリストの取得に失敗、インスタンスの停止に失敗）

## 使用例

### SillyTavernインスタンスの作成と管理

```bash
# 新しいインスタンスの作成
curl -X POST http://localhost:3000/api/instances \
     -H "Content-Type: application/json" \
     -H "X-ST-Admin-Key: your-secret-admin-key" \
     -d '{"port": 8001}'

# すべてのインスタンスのクエリ
curl http://localhost:3000/api/instances \
     -H "X-ST-Admin-Key: your-secret-admin-key"

# インスタンスの停止
curl -X POST http://localhost:3000/api/instances/st-instance-8001/stop \
     -H "X-ST-Admin-Key: your-secret-admin-key"

# インスタンスの削除
curl -X DELETE http://localhost:3000/api/instances/st-instance-8001 \
     -H "X-ST-Admin-Key: your-secret-admin-key"
```
