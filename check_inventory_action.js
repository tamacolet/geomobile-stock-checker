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
// 各商品の前回の在庫状態を記録するオブジェクト
let previousStockStatus = {};

// メール送信用のトランスポーター設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

// メール通知を送信する関数
async function sendNotification(product, isInStock) {
  try {
    // 在庫状態に基づいて件名と本文を変更
    const subject = isInStock 
      ? `【在庫あり】${product.productName}` 
      : `【在庫なし】${product.productName}`;
    
    const statusMessage = isInStock
      ? '在庫が確認されました'
      : '在庫がなくなりました';
    
    // メール本文の構築
    const mailOptions = {
      from: emailUser,
      to: recipientEmail,
      subject: subject,
      html: `
        <h2>${statusMessage}</h2>
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
      
      // 商品IDとして使用するURLのユニークな部分を取得
      const productId = url;
      
      // この商品の前回のステータスを取得（存在しない場合はundefined）
      const previousStatus = previousStockStatus[productId];
      
      // 在庫状態が変化した場合のみ通知
      if (previousStatus === undefined || previousStatus !== result.inStock) {
        console.log(`🔄 在庫状態変化検出: ${result.productName} (${previousStatus === undefined ? '初回チェック' : previousStatus ? '在庫あり→なし' : '在庫なし→あり'})`);
        
        // 在庫状態に基づいて通知
        await sendNotification(result, result.inStock);
        
        // 在庫状態を更新
        previousStockStatus[productId] = result.inStock;
      } else {
        console.log(`🔄 在庫状態に変化なし: ${result.productName} (${result.inStock ? '在庫あり継続中' : '在庫なし継続中'})`);
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
