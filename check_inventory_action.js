// 必要なモジュールをインポート
const nodemailer = require('nodemailer');
const { checkInventory } = require('./inventory_checker');

// 環境変数から設定を読み込み
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const recipientEmail = process.env.RECIPIENT_EMAIL;
const productUrlsString = process.env.PRODUCT_URLS;

// 商品URLリストを解析 (カンマまたは改行で区切る)
const productsToMonitor = productUrlsString.split(/[,\n]+/).map(url => url.trim()).filter(url => url);

// グローバル変数
let notificationSent = {};

// メール送信用のトランスポーター設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

// メール通知を送信する関数
async function sendNotification(product) {
  try {
    // メール本文の構築
    const mailOptions = {
      from: emailUser,
      to: recipientEmail,
      subject: `【在庫あり】${product.productName}`,
      html: `
        <h2>在庫が確認されました</h2>
        <p><strong>商品名:</strong> ${product.productName}</p>
        <p><strong>ステータス:</strong> ${product.status}</p>
        <p><strong>チェック時刻:</strong> ${product.checkedAt}</p>
        <p><a href="${product.url}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">商品ページを開く</a></p>
        <p style="font-size: 0.8em; color: #666;">※この通知はGitHub Actionsによって自動送信されています</p>
      `
    };

    // メール送信
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ メール送信成功 (${product.productName}): ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ メール送信エラー (${product.productName}):`, error);
    return false;
  }
}

// メイン実行関数
async function run() {
  console.log(`🔍 在庫チェック開始: ${new Date().toLocaleString('ja-JP')}`);
  console.log(`📋 チェック対象商品数: ${productsToMonitor.length}`);
  
  for (const url of productsToMonitor) {
    try {
      console.log(`⏳ 確認中: ${url}`);
      const result = await checkInventory(url);
      
      if (result.error) {
        console.error(`❌ エラー (${url}):`, result.error);
        continue;
      }
      
      console.log(`📊 ${result.productName}: ${result.status}`);
      
      // 在庫がある場合に通知
      if (result.inStock) {
        console.log(`🎉 在庫あり検出: ${result.productName}`);
        await sendNotification(result);
      }
    } catch (error) {
      console.error(`❌ 予期せぬエラー (${url}):`, error);
    }
    
    // サーバー負荷軽減のための待機
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(`✅ 在庫チェック完了: ${new Date().toLocaleString('ja-JP')}`);
}

// 実行
run().catch(error => {
  console.error('❌ プログラム実行エラー:', error);
  process.exit(1);
});
