// 驗證「線上網站跑的是不是目前這份原始碼」。
//
//   node scripts/verify-live.mjs                      # 預設 https://talent-core-pro.com
//   node scripts/verify-live.mjs https://xxx.workers.dev
//   npm run verify:live -- https://xxx.workers.dev
//
// 為什麼需要這支腳本：網站是單頁靜態匯出，改名或改配色後如果沒有重新
// build + deploy，線上會**完全正常地**繼續服務舊建置 —— 沒有錯誤、沒有警告，
// 只是內容是舊的。瀏覽器快取與 service worker 也會造成一樣的畫面，
// 光看瀏覽器無法分辨。這裡一律帶 cache-buster 且 no-store，
// 所以回報的是**伺服器現在真正吐出來的內容**。
//
// 期望值不寫死品牌字串，而是從 public/index.html 與 public/manifest.json 讀出來，
// 因此日後再改名不需要同步修改這支腳本。
import { readFileSync } from 'node:fs';

const origin = (process.argv[2] ?? 'https://talent-core-pro.com').replace(/\/+$/, '');

const localHtml = readFileSync('public/index.html', 'utf8');
const localManifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
const expectedTitle = /<title>([^<]*)<\/title>/.exec(localHtml)?.[1]?.trim() ?? '';
const expectedLang = /<html lang="([^"]*)"/.exec(localHtml)?.[1] ?? '';

const results = [];
const check = (label, ok, detail) => results.push({ label, ok, detail });

/** 帶 cache-buster 的 GET，繞過 CDN 與本機快取。 */
async function get(path) {
  const url = `${origin}${path}${path.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

try {
  const home = await get('/');
  check('首頁可連線', home.status === 200, `HTTP ${home.status}`);

  const liveTitle = /<title>([^<]*)<\/title>/.exec(home.body)?.[1]?.trim() ?? '(找不到 title)';
  check(
    '首頁標題＝目前原始碼',
    liveTitle === expectedTitle,
    liveTitle === expectedTitle ? liveTitle : `線上「${liveTitle}」／應為「${expectedTitle}」`,
  );

  const liveLang = /<html lang="([^"]*)"/.exec(home.body)?.[1] ?? '(找不到 lang)';
  check(
    `語系標記＝${expectedLang}`,
    liveLang === expectedLang,
    liveLang === expectedLang ? liveLang : `線上 lang="${liveLang}"`,
  );

  const manifest = await get('/manifest.json');
  let liveName = '(讀取失敗)';
  try {
    liveName = JSON.parse(manifest.body).name;
  } catch {
    liveName = `(不是 JSON, HTTP ${manifest.status})`;
  }
  check(
    'PWA manifest 名稱＝目前原始碼',
    liveName === localManifest.name,
    liveName === localManifest.name
      ? liveName
      : `線上「${liveName}」／應為「${localManifest.name}」`,
  );

  const config = await get('/bilt-config.js');
  const placeholder =
    config.body.includes('__BILT_URL__') || config.body.includes('__BILT_ANON_KEY__');
  check(
    '後端連線設定已填入',
    !placeholder,
    placeholder
      ? 'bilt-config.js 仍是佔位字串 → 網站改吃建置時的 EXPO_PUBLIC_*；兩者都空的話登入會失敗'
      : '執行階段設定檔已有值',
  );

  const admin = await get('/admin');
  const robots = admin.headers.get('x-robots-tag') ?? '';
  check(
    '/admin 已排除搜尋引擎',
    robots.includes('noindex'),
    robots || '沒有 X-Robots-Tag 標頭（public/_headers 沒生效）',
  );
} catch (error) {
  check('連線', false, error instanceof Error ? error.message : String(error));
}

console.log(`檢查對象：${origin}\n`);
for (const { label, ok, detail } of results) {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.log(
    '\n有項目不符。標題／manifest 不符＝線上是舊建置，重新執行 npm run deploy:web（或推一次 commit 觸發自動建置）。',
  );
  process.exit(1);
}
console.log('\n線上版本與目前原始碼一致。');
