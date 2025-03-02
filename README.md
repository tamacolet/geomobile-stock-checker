# GEO モバイル在庫チェッカー

GEO モバイルの商品在庫を自動的に監視し、在庫が確認されたらメール通知するツールです。GitHub Actions を使用して定期的に在庫をチェックします。

## 機能

- 複数商品の在庫状態を自動的に監視
- 在庫が確認されたらメール通知
- GitHub Actions による定期実行
- 古い URL パターンの自動変換

## セットアップ方法

### 前提条件

- GitHub アカウント
- Node.js（ローカルテスト用）

### インストール

1. このリポジトリをフォークまたはクローンします
2. 環境変数を設定します（下記参照）

## 環境変数の設定

このプロジェクトでは以下の環境変数を使用します。GitHub Secrets に設定してください。

| 環境変数        | 説明                                         | 例                     |
| --------------- | -------------------------------------------- | ---------------------- |
| EMAIL_USER      | 通知メール送信用の Gmail アドレス            | example@gmail.com      |
| EMAIL_PASS      | メール送信用のアプリパスワード               | abcdefghijklmnop       |
| RECIPIENT_EMAIL | 通知の送信先メールアドレス                   | your-email@example.com |
| PRODUCT_URLS    | 監視する商品 URL（カンマまたは改行で区切る） | 下記参照               |

### PRODUCT_URLS の設定例

以下のように、カンマまたは改行で区切って複数の URL を指定できます：

```
# カンマ区切りの例
https://mvno.geo-mobile.jp/uqmobile/smartphone/iPhoneXR_simfree,https://mvno.geo-mobile.jp/uqmobile/smartphone/iPhone11_simfree

# 改行区切りの例
https://mvno.geo-mobile.jp/uqmobile/smartphone/iPhoneXR_simfree
https://mvno.geo-mobile.jp/uqmobile/smartphone/iPhone11_simfree
https://mvno.geo-mobile.jp/uqmobile/smartphone/iPhone12_simfree
```

## GitHub Secrets の設定方法

1. GitHub リポジトリのページで「Settings」タブを開く
2. 左側のメニューから「Secrets and variables」→「Actions」を選択
3. 「New repository secret」ボタンをクリック
4. 必要な環境変数をそれぞれ設定

## 実行方法

### 自動実行

デフォルトでは、GitHub Actions が 5 分ごとに自動的に在庫チェックを実行します。
この頻度は`.github/workflows/check-inventory.yml`ファイルの`cron`設定で変更できます。

```yaml
schedule:
  - cron: "*/5 * * * *" # 5分ごとに実行
```

### 手動実行

GitHub リポジトリの「Actions」タブから「在庫チェック」ワークフローを選択し、
「Run workflow」ボタンをクリックすることで手動実行も可能です。

## ローカル開発・テスト

ローカルでテストする場合は以下のようにします：

1. 依存パッケージをインストール

   ```
   npm install
   ```

2. 環境変数を設定して実行
   ```
   export EMAIL_USER="your-email@gmail.com"
   export EMAIL_PASS="your-app-password"
   export RECIPIENT_EMAIL="recipient@example.com"
   export PRODUCT_URLS="https://mvno.geo-mobile.jp/uqmobile/smartphone/iPhoneXR_simfree"
   node check_inventory_action.js
   ```

## 注意事項

- Gmail で SMTP 送信をする場合は、セキュリティの「安全性の低いアプリの許可」ではなく「アプリパスワード」を使用してください
- アクセス頻度が高すぎるとサーバーから制限される可能性があるため、実行頻度は適切に設定してください
- 商品 URL は変更される可能性があるため、定期的に確認してください

## ライセンス

ISC
