// GEOモバイル在庫チェッカー (コアライブラリ)
// ウェブブラウザとNode.js両方で使用できる

// 古いURLパターンを新しいURLパターンに変換
function convertOldUrlToNew(url) {
  // URLのパターンをチェック
  
  // パターン1: /uqmobile/device/ → /uqmobile/smartphone/
  if (url.includes('/uqmobile/device/')) {
    const productName = url.split('/').pop().replace('-simfree', '');
    // iphone-11 → iPhone11 の形式に変換
    const formattedName = 'iPhone' + productName.split('-')[1].toUpperCase()[0] + productName.split('-')[1].slice(1);
    return `https://mvno.geo-mobile.jp/uqmobile/smartphone/${formattedName}_simfree`;
  }
  
  // パターン2: /yj-mobile/goods/ → /uqmobile/smartphone/
  if (url.includes('/yj-mobile/goods/')) {
    const productName = url.split('/').pop();
    // iphone-11 → iPhone11 の形式に変換
    const formattedName = 'iPhone' + productName.split('-')[1].toUpperCase()[0] + productName.split('-')[1].slice(1);
    return `https://mvno.geo-mobile.jp/uqmobile/smartphone/${formattedName}_simfree`;
  }
  
  return url;
}

// 単一商品の在庫確認
async function checkInventory(url) {
  // URLの修正を試みる
  const fixedUrl = convertOldUrlToNew(url);

  try {
    // fetch API を使用してHTMLを取得（ブラウザとNode.js両方で動作）
    const response = await fetch(fixedUrl, {
      method: 'GET',
      headers: {
        // ブラウザのUser-Agentを偽装
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://mvno.geo-mobile.jp/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // ステータスコードが正常でない場合のエラーハンドリング
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`商品ページが見つかりません。商品URLが変更されたか、取り扱いが終了した可能性があります。(HTTP 404)`);
      } else if (response.status === 403) {
        throw new Error(`アクセスが拒否されました。アクセス頻度を下げるか、しばらく時間をおいてから再試行してください。(HTTP 403)`);
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    }

    // HTMLテキストを取得
    const html = await response.text();
    
    // デバッグ用に在庫切れ指標の検出結果をログに出力（可能な場合）
    if (typeof console !== 'undefined') {
      console.debug('在庫切れ指標の検出結果:');
      console.debug(`- id="js-soldout": ${html.includes('id="js-soldout"')}`);
      console.debug(`- class="soldout": ${html.includes('class="soldout"')}`);
      console.debug(`- class="sold_out": ${html.includes('class="sold_out"')}`);
      console.debug(`- class="out-of-stock": ${html.includes('class="out-of-stock"')}`);
      console.debug(`- 品切れ中: ${html.includes('品切れ中')}`);
      console.debug(`- 在庫切れ: ${html.includes('在庫切れ')}`);
      console.debug(`- 現在お取り扱いしておりません: ${html.includes('現在お取り扱いしておりません')}`);
    }
    
    // 在庫状態を確認（複数の在庫切れ指標をチェック）- クラス名のスペースに注意
    const hasSoldOutElement = 
      html.includes('id="js-soldout"') || 
      html.includes('class="soldout"') || 
      html.includes('class="sold_out"') || // 重要: スペースありの表記も対応
      html.includes('class="out-of-stock"') || 
      html.includes('品切れ中') || 
      html.includes('在庫切れ') ||
      html.includes('現在お取り扱いしておりません') ||
      html.includes('<div class="soldout_title">') ||
      html.includes('完売いたしました');

    // 商品名を取得（タイトルから）
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const productName = titleMatch ? titleMatch[1].split('｜')[0] : 'Unknown Product';

    // HTMLダンプの保存（デバッグ用、Node.js環境のみ）
    // if (typeof require !== 'undefined') {
    //   const fs = require('fs');
    //   fs.writeFileSync(`debug_${new Date().getTime()}.html`, html);
    // }

    return {
      productName: productName,
      inStock: !hasSoldOutElement,
      status: !hasSoldOutElement ? '在庫あり' : '在庫切れ',
      url: fixedUrl,
      checkedAt: new Date().toLocaleString('ja-JP')
    };
  } catch (error) {
    // エラーをキャッチして整形された結果を返す
    return {
      error: error.message,
      url: fixedUrl,
      checkedAt: new Date().toLocaleString('ja-JP')
    };
  }
}

// 複数商品の在庫確認
async function checkMultipleProducts(urls) {
  const results = [];
  for (const url of urls) {
    const result = await checkInventory(url);
    results.push(result);
    
    // アクセス頻度を下げるための遅延（Node.js環境でのみ機能）
    if (typeof setTimeout !== 'undefined' && typeof window === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒の遅延
    }
  }
  return results;
}

// Node.js環境とブラウザ環境の両方で動作するようにエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkInventory, checkMultipleProducts };
} else {
  // ブラウザ用
  window.checkInventory = checkInventory;
  window.checkMultipleProducts = checkMultipleProducts;
}

// 使用例:
// Node.js: const { checkInventory } = require('./inventory_checker');
// ブラウザ: <script src="inventory_checker.js"></script> の後に window.checkInventory() を呼び出し 
