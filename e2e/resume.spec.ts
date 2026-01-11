import { test, expect } from '@playwright/test';
import path from 'path';

test('Resume generation flow', async ({ page }) => {
  // 1. トップページにアクセス
  await page.goto('/');

  // 2. 基本情報の入力
  await page.fill('input[id="firstName"]', 'Taro');
  await page.fill('input[id="lastName"]', 'Yamada');
  await page.fill('input[id="email"]', 'taro.test@example.com');
  // (必要に応じて他のフィールドも追加)

  // 3. ファイルアップロード (ダミーファイルを使用)
  // 注意: テスト実行前に e2e/fixtures ディレクトリに dummy.pdf と dummy.jpg を配置する必要があります
  // 今回は簡易的にファイル選択inputを特定してアップロードします
  
  // input[type="file"]が隠れている場合があるため、ラベルや特定のクラスで探すこともありますが
  // ここではinput要素を直接操作します。
  
  // 写真アップロード (最初のinput type=fileと仮定、または具体的なセレクタを指定)
  const fileInputs = await page.locator('input[type="file"]').all();
  
  // 写真input (Refで制御されている hidden input)
  if (fileInputs.length > 0) {
     // 最初のinputは写真用 (実装順序依存のため、より厳密なセレクタ推奨)
     // page.tsxの実装を見ると、写真用inputは隠れており、クリックで開く仕様。
     // PlaywrightではsetInputFilesで直接隠しinputに値を設定可能。
     await fileInputs[0].setInputFiles({
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('this is a dummy image buffer') 
     });
  }

  // 履歴書PDFアップロード
  if (fileInputs.length > 1) {
      await fileInputs[1].setInputFiles({
        name: 'resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n%...') // 最小限のPDFヘッダー
      });
  }

  // 4. Generate Resumeボタンをクリック
  // "Generate Resume" というテキストを含むボタンを探す
  const generateButton = page.getByRole('button', { name: /Generate Resume/i });
  await expect(generateButton).toBeVisible();
  await generateButton.click();

  // 5. 生成待ち
  // ボタンが "Generating..." に変わることを確認
  await expect(page.getByText('Generating...')).toBeVisible();

  // 6. 完了確認
  // "Download PDF" ボタンが表示されるまで待機 (タイムアウトを長めに設定)
  const downloadButton = page.getByRole('button', { name: /Download PDF/i });
  await expect(downloadButton).toBeVisible({ timeout: 60000 });

  // 成功！
});

