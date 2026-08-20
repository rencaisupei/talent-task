# Welcome to your Bilt project

[![Built with Bilt](https://img.shields.io/endpoint?url=https%3A%2F%2Fapp.bilt.me%2Fapi%2Fbadge)](https://bilt.me)

## Project info

**Preview URL**: https://app.bilt.me/project/3a907fd0-a0ca-4468-b6e6-cc0015e74de0/preview

**Project ID**: `3a907fd0-a0ca-4468-b6e6-cc0015e74de0`

## How can I edit this app?

There are several ways of editing your application.

**Use Bilt**

Simply visit your [Bilt Project](https://app.bilt.me/agent/3a907fd0-a0ca-4468-b6e6-cc0015e74de0) and start sending messages. Describe what you want to change, add, or fix in natural language.

Changes made via Bilt are instant - just send a message and your app updates.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can export the source code from Bilt and make changes directly.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Export and clone your Bilt project.
# (Download source from Bilt or connect to your git repo)
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the Expo development server.
npx expo start
```

Scan the QR code with Expo Go on your phone to see your app running locally.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- React Native
- Expo
- TypeScript
- AsyncStorage (local data persistence)
- Expo Router (navigation)

All generated automatically by Bilt from your natural language instructions.

## How can I test this project?

**Option 1: Instant Preview (Recommended)**

Open the preview URL in your browser: `https://app.bilt.me/project/3a907fd0-a0ca-4468-b6e6-cc0015e74de0/preview`

Scan the QR code with Expo Go ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) on your phone.

**Option 2: Run Locally**

```sh
npm install
npx expo start
```

Then scan the QR code with Expo Go.

## How can I deploy this project?

Go to your [Bilt Project](https://app.bilt.me/agent/3a907fd0-a0ca-4468-b6e6-cc0015e74de0), after that go to Settings -> App Store.

### Deploy with Bilt

Simply send a message to your Bilt project: "Deploy this app to production"

Bilt will handle the build and provide you with download links or submission-ready builds.

## 網頁版靜態匯出與部署

**網頁版同時服務兩側**：根網域是一般使用者網站（任務牆、登入、發布、投標、對話），
`/admin` 底下是管理員專屬平台（`app/admin/`）。同一份 Expo 專案以
`web.output: 'single'`（SPA）匯出成靜態網站，一次部署就同時上線。
一般使用者頁面允許被搜尋引擎收錄，`/admin` 一律不收錄（第 8 節）。

> 手機 App（iOS／Android）只有一般使用者介面，沒有任何管理入口：
> `app/admin/_layout.tsx` 在原生一律 `Redirect` 回 `/(tabs)`。

### 0. 最少步驟上線（全在瀏覽器，不用碰 DNS）

只是想先讓網站上線、拿到一個能分享的網址，照下面三步就夠了。第 3、6、7 節都是選配，
晚點再做也不影響已經上線的網站。

前置：程式碼要在 GitHub（在 Bilt 專案設定裡把專案連到 GitHub，一次性動作）。

1. Cloudflare 儀表板 → **Compute (Workers)** → Create → **Import a repository**
   → 授權後選這個 repo。
2. 填這幾欄，其他保持預設：
   - Project name：`instantgig`（要與 `wrangler.toml` 的 `name` 一致）
   - Build command：`npm run build:web`
   - Deploy command：`npx wrangler deploy`（預設值，不用改）
   - Build variables（連線設定的其中一種給法，見 0.1）：
     `EXPO_PUBLIC_BILT_URL` = `https://<project-id>.cloud.bilt.me`、
     `EXPO_PUBLIC_BILT_ANON_KEY` = `<anon-key>`
     （不想設變數的話，改 `public/bilt-config.js` 再 commit 也可以）
3. 按 **Create and deploy**，等狀態跑到 Success。網址就是
   `https://instantgig.<你的子網域>.workers.dev`，打開會看到任務牆；
   管理平台在同一個網址的 `/admin`。

之後每次改動同步到 GitHub，Cloudflare 會自動重新建置並部署，不需要再進儀表板。

輸出目錄與 SPA fallback 都寫在 `wrangler.toml` 的 `[assets]`（`directory = "./dist"`、
`not_found_handling = "single-page-application"`），所以儀表板不用填輸出目錄。

上線後要接著處理的兩件事：

- **連線設定是必要的**：使用者登入與管理員登入都要呼叫後端。
  連線資訊有兩種給法，任一種即可（見下面「連線設定怎麼給」）：
  編輯 `dist/bilt-config.js`（部署後可改，不用重建），
  或設定 Build variables `EXPO_PUBLIC_BILT_URL` 與 `EXPO_PUBLIC_BILT_ANON_KEY`。
  兩邊都沒給的話任務牆會讀不到資料，登入頁會顯示「讀不到後端連線設定」。
- **`/admin` 只有管理員帳密保護**：網站本身是公開的（本來就要公開），
  但管理入口也在同一個網域上，任何人都能開到登入頁。
  建議照第 7 節用 Cloudflare Access 只對 `/admin` 這個路徑再加一道網域層驗證。

### 0.1 連線設定怎麼給

`lib/biltConfig.ts` 是唯一解析點，依序嘗試三個來源，第一個「網址與金鑰都齊全」的勝出：

1. **網頁執行階段設定檔** `public/bilt-config.js`（匯出時原樣複製成 `dist/bilt-config.js`）。
   `index.html` 以同步 `<script>` 在 App bundle 之前載入它，所以**部署後改這個檔案就生效，
   不必重新建置**。預設值是 `__BILT_URL__` / `__BILT_ANON_KEY__` 佔位字串，
   保持原樣時這個來源會被忽略。只有網頁版有這個來源。
2. **Expo manifest 的 `extra.bilt`**（`app.config.ts` 從環境變數填入）。
   原生版與 Expo Go 走這條：manifest 是每次啟動才取得的，
   不會被 Metro 的舊轉譯快取凍結成舊值。
3. **建置時環境變數** `EXPO_PUBLIC_BILT_URL` / `EXPO_PUBLIC_BILT_ANON_KEY`（Babel 內嵌進 bundle）。

網址與金鑰一定是「同一個來源成對取用」，不會出現新網址搭舊金鑰的組合。
`EXPO_PUBLIC_BILT_ANON_KEY` 是公開金鑰（publishable key），本來就會出現在前端 bundle
與 manifest 裡，資料保護靠資料庫的 RLS 政策；**不要**把 service key 放進任何一個來源。

改 `dist/bilt-config.js` 的例子：

```js
globalThis.__BILT_CONFIG__ = {
  url: 'https://<project-id>.cloud.bilt.me',
  anonKey: '<anon-key>',
};
```

`public/_headers` 已把 `/bilt-config.js` 設成 `max-age=0, must-revalidate`，
改完不會被 CDN 快取住。

### 1. 本機匯出

```sh
npm ci

# 連線設定的其中一種給法（另一種是改 public/bilt-config.js，見 0.1）。
# 兩邊都沒給的話登入頁會顯示「讀不到後端連線設定」
export EXPO_PUBLIC_BILT_URL="https://<project-id>.cloud.bilt.me"
export EXPO_PUBLIC_BILT_ANON_KEY="<anon-key>"

npm run build:web       # 輸出到 dist/
npm run serve:web       # 以 SPA 模式在 http://localhost:4173 預覽
```

`npm run build:pwa` 會在匯出後額外產生 `dist/sw.js`（Workbox 離線快取），
需要可安裝的 PWA 時再用。

`public/` 內的檔案（`index.html`、`bilt-config.js`、`manifest.json`、`robots.txt`、
`_redirects`、`_headers`、`icons/`）會原樣複製進 `dist/`。

### 2. 部署到 Cloudflare Workers（建議方式）

託管、DNS 與管理平台的存取保護全部在 Cloudflare：一個 Worker 以靜態資產的方式服務整個
網站（一般使用者頁面 ＋ `/admin` 管理平台）。`wrangler.toml` 指定 Worker 名稱、
資產目錄（`dist/`）與 SPA fallback；快取與 `/admin` 的 `noindex` 標頭由
`public/_headers` 提供，`public/_redirects` 目前刻意沒有任何轉址規則
（匯出時原樣複製進 `dist/`，Workers 與 Pages 都讀這兩個檔案）。

> Cloudflare 新版儀表板的「Import a repository」建立的是 **Worker**（建置後執行
> Deploy command `npx wrangler deploy`），不是 Pages 專案。本 repo 的 `wrangler.toml`
> 就是為這個流程寫的。若 log 出現
> `Missing entry-point to Worker script or to assets directory`，代表 `wrangler.toml`
> 缺少 `[assets] directory`（Pages 用的 `pages_build_output_dir` 對 `wrangler deploy` 無效）。

**方式 A：連結 Git 自動部署（建議）**

前置：repo 已推到 GitHub 或 GitLab，且根目錄有 `package-lock.json`（建置會用 `npm ci`）。

1. **建立專案**：Cloudflare 儀表板 → Compute (Workers) → Create →
   **Import a repository** → 授權 GitHub／GitLab → 選這個 repo（可只授權單一 repo）。
2. **Worker 名稱**填 `instantgig`，要與 `wrangler.toml` 的 `name` 一致，否則本機
   `npm run deploy:web` 會部署到另一個 Worker。這個名稱同時決定
   `instantgig.<子網域>.workers.dev` 網址。
3. **Production branch** 選正式分支（通常 `main`）。
4. **Build settings**：
   - Build command：`npm run build:web`
   - Deploy command：`npx wrangler deploy`（預設值）
   - Root directory：留空
   - 不需要填輸出目錄，它在 `wrangler.toml` 的 `[assets] directory` 裡
5. **Build variables**（連線設定的其中一種給法，見 0.1）：使用者登入、管理員登入與帳號
   管理都要呼叫後端，連線設定兩邊都沒給的建置會產出一個沒人能登入的網站。
   到 Worker → Settings → **Build** → Variables and Secrets 設定：
   - `EXPO_PUBLIC_BILT_URL` = `https://<project-id>.cloud.bilt.me`
   - `EXPO_PUBLIC_BILT_ANON_KEY` = `<anon-key>`
   - 這兩個值是**建置時**寫進 bundle 的，必須設在 Build 區塊（不是執行時的 Worker
     變數），改完要重新觸發一次建置才會生效。不想動變數的話，把值填進
     `public/bilt-config.js` 再 commit（或部署後直接改 `dist/bilt-config.js`）。
   - Node 版本由 repo 根目錄的 `.node-version`（`20.19.4`）決定，不必再設
     `NODE_VERSION`；若要臨時換版，設 `NODE_VERSION` 會覆寫該檔案。
6. **Create and deploy**，等第一次建置跑完（Building → Deploying → Success）。
   完成後先用 `https://instantgig.<子網域>.workers.dev` 開啟確認會看到任務牆，
   再開 `/admin` 確認會進到管理員登入頁。
7. 之後每次 push 到 production 分支自動重新建置並部署；其他分支與 PR 會產生預覽版本網址。

建置或部署失敗時看 Deployments → 該筆 → Build log，常見原因：

- **`Missing entry-point to Worker script or to assets directory`**：`wrangler.toml`
  沒有 `[assets] directory`，或 Deploy command 被改成 `wrangler deploy` 以外的東西。
- **`Cannot find module '@babel/core'` / `tailwindcss`**：建置環境設了
  `NODE_ENV=production` 時，npm 會跳過 `devDependencies`。因此 Metro 打包必需的
  `@babel/core`、`@babel/runtime`、`babel-plugin-react-compiler`、`tailwindcss`
  （uniwind 需要）、`typescript`（expo-router typedRoutes 需要）都放在
  `dependencies` 而非 `devDependencies` — 移動它們會讓網頁建置壞掉。
  仍失敗的話刪掉 `NODE_ENV`，或把 Build command 改成
  `npm install --include=dev && npm run build:web`。
- **`dist/` 只有 `index.html`、`manifest.json`、`icons/` 這些 `public/` 的檔案，
  沒有 `_expo/` 目錄**：表示 `public/` 複製完後 JS 打包就中斷了（多半是上一項，
  或 `JavaScript heap out of memory`）。正常的 `dist/index.html` 會被注入
  `<script src="/_expo/static/js/web/entry-*.js">`，且 `%LANG_ISO_CODE%` 已被取代。
- `EXPO_PUBLIC_*` 設在執行時變數而不是 Build 變數，建置時讀不到（登入頁會顯示
  「讀不到後端連線設定」）。這種情況可以不重建，直接改 `dist/bilt-config.js` 補上。
- `package-lock.json` 沒跟著 commit，`npm ci` 直接失敗。
- `workers.dev` 網址與每個預覽版本網址都會連帶公開 `/admin` 入口（只剩帳密保護）。
  綁好自訂網域後把 `workers.dev` 路由 Disable，並照第 7 節對 `/admin` 路徑加 Access。

**方式 B：本機用 Wrangler 直接部署**

本機部署不會讀儀表板的建置變數，`EXPO_PUBLIC_*` 必須在自己的 shell 匯出
（或把值填進 `public/bilt-config.js`）。

```sh
export EXPO_PUBLIC_BILT_URL="https://<project-id>.cloud.bilt.me"
export EXPO_PUBLIC_BILT_ANON_KEY="<anon-key>"

npx wrangler login
npm run deploy:web          # 建置後部署為線上版本
npm run deploy:pwa          # 同上，並產生 dist/sw.js（PWA 離線快取與安裝提示）
npm run deploy:web:preview  # 建置後只上傳預覽版本，不接線上流量
```

`wrangler.toml` 已指定資產目錄，指令不要再附加 `dist` 或 `--assets` 參數。

`deploy:web` **不會**產生 service worker，因此 `lib/registerServiceWorker.ts` 註冊
`/sw.js` 時會失敗（已 catch，網站照常運作，只是沒有離線快取與「加入主畫面」提示）。
注意失敗原因不是 404：`wrangler.toml` 的 `not_found_handling = "single-page-application"`
會讓 `/sw.js` 回傳 `index.html`，瀏覽器因為 MIME type 不是 JavaScript 而拒絕註冊。
好處是舊的 service worker 不會殘留在使用者裝置上；壞處是 console 會有一行錯誤。
要 PWA 就用 `deploy:pwa`。Git 自動部署要 PWA 時，把儀表板的 Build command 改成
`npm run build:pwa`。

第一次本機部署的完整順序：

```sh
npx wrangler login            # 開瀏覽器授權，只需做一次
npm run lint && npm run lint:css
npm run deploy:web            # 或 deploy:pwa
```

`wrangler` 輸出的最後一行會是
`https://instantgig.<你的子網域>.workers.dev`，先用它確認網站起得來（會看到任務牆，
`/admin` 會看到管理員登入頁），再做第 3 節綁定自訂網域。

**線上畫面是舊版（例如還是舊品牌、舊配色）**

這是單頁靜態匯出：只要沒有重新 build + deploy，線上會**完全正常地**繼續服務舊建置。
沒有錯誤、沒有警告，只是內容是舊的。改了原始碼不等於改了線上網站。

不要用瀏覽器判斷（瀏覽器快取與 service worker 會造成一樣的畫面），用：

```sh
npm run verify:live                              # 預設檢查 talent-core-pro.com
npm run verify:live -- https://xxx.workers.dev   # 或指定其他網址
```

它會帶 cache-buster 直接向伺服器要 `/`、`/manifest.json`、`/bilt-config.js`、`/admin`，
比對線上的標題與 PWA 名稱是否等於現在 `public/` 裡的值，並檢查連線設定與
`/admin` 的 noindex 標頭。期望值是從原始碼讀出來的，改名後不必修改腳本。

標題或 manifest 名稱不符＝線上是舊建置，重跑 `npm run deploy:web`
（用 Git 自動部署的話推一次 commit 觸發重建，並確認建置真的成功）。
全部通過但你的瀏覽器還是舊畫面，才是本機快取問題：開無痕視窗，或
DevTools → Application → Service Workers → Unregister 後強制重新載入。

**若你想改用 Cloudflare Pages**

Pages 仍可用，但要把 `wrangler.toml` 的 `[assets]` 區塊換回
`pages_build_output_dir = "dist"`，`package.json` 的 deploy 指令換回
`wrangler pages deploy --branch=main`，並在儀表板選 Pages → Connect to Git
（Framework preset `None`、Build command `npm run build:web`、Build output directory `dist`）。
兩者不能共存於同一份 `wrangler.toml`。

### 3. 綁定主網域與 DNS

前置條件：`talent-core-pro.com` 的 DNS 已由 Cloudflare 託管（尚未轉移請先做第 6 節）。

網站是「一般使用者網站 ＋ `/admin` 管理平台」，所以直接綁主網域。在 Worker →
Settings → **Domains & Routes** → Add → **Custom domain** 加入 `talent-core-pro.com`，
再重複一次加入 `www.talent-core-pro.com`；zone 在同一個 Cloudflare 帳號時 DNS 記錄會自動建立：

| 網域                      | 記錄類型 | 名稱／Host | 值                     | 用途            |
| ------------------------- | -------- | ---------- | ---------------------- | --------------- |
| `talent-core-pro.com`     | CNAME    | `@`        | 由 Cloudflare 自動填入 | 網站主入口      |
| `www.talent-core-pro.com` | CNAME    | `www`      | 由 Cloudflare 自動填入 | 加上 www 也能開 |

Worker 的名稱（`wrangler.toml` 的 `name`，目前是 `instantgig`）**不需要跟著改**：它只是
Cloudflare 內部識別碼與 `workers.dev` 子網域，改名等於建立另一個 Worker，自訂網域、
Access 政策與環境變數都要重新設定一次。

#### 錯誤：「Please ensure you are providing the root domain and not any subdomains」（Code 1099）

**這則訊息不是 Custom domain 的錯誤。** 它出自 Cloudflare 的 **Add a site／新增網域**
（把一個 zone 加進帳號）流程，官方文件把它列在
`https://developers.cloudflare.com/dns/zone-setups/troubleshooting/cannot-add-domain/`
的「Register the domain」段落，錯誤代碼 **1099**。

Worker 的 Custom domain 欄位**接受子網域**（`shop.example.com`、`www.example.com` 都合法，
本專案的 `www` 就是這樣加的），所以它不可能吐出這句話。看到這句就代表輸入框不是
Domains & Routes 的那一個。

而且本專案**不需要跑 Add a site**：2026-08-20 以註冊局 RDAP 實測，`talent-core-pro.com`
的註冊商就是 Cloudflare（NS `damien`／`leah.ns.cloudflare.com`、狀態
`client transfer prohibited`、DNSSEC 未簽署）。在 Cloudflare 註冊的網域，zone 本來就已經
建立在某個 Cloudflare 帳號裡，再「新增」一次只會失敗。

排查順序：

| 檢查                | 怎麼看                                                                                         | 對應處理                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 我在哪個畫面        | 輸入框旁邊有方案選擇／掃描 DNS／Continue → 是 Add a site                                       | 離開這頁，改走 Compute (Workers) → Worker → Settings → Domains & Routes → Add |
| 輸入的字串          | 只能是 `talent-core-pro.com`。有 `www.`、`https://`、結尾斜線、前後空白或整段網址都會觸發 1099 | 手動重打，不要從網址列複製                                                    |
| zone 在不在這個帳號 | 帳號首頁的網域清單有沒有 `talent-core-pro.com`                                                 | 沒有＝登入了另一個帳號，用儀表板的 Forgot email 找回註冊網域的那個帳號        |
| Worker 在不在       | Compute (Workers) → Overview 有沒有 `instantgig`                                               | 沒有＝還沒部署，先做第 2 節；Add a site **不能**代替部署                      |

不想碰儀表板也可以，把自訂網域寫進 `wrangler.toml` 由部署建立（zone 必須在同一帳號，
否則部署會直接報錯）：

```toml
[[routes]]
pattern = "talent-core-pro.com"
custom_domain = true

[[routes]]
pattern = "www.talent-core-pro.com"
custom_domain = true
```

加好後 `npm run deploy:web` 會一併建立兩個 Custom domain 與 DNS 記錄，效果與儀表板相同。

#### 舊網域 `instantgig.tw`：不需要處理，也不需要重導

2026-08-20 用 TWNIC 官方註冊資料查詢（`https://ccrdap.twnic.tw/tw/domain/instantgig.tw`）
確認：**這個網域從未被註冊**，回應是 404（同一個查詢端點查 `twnic.tw` 會正常回傳資料，
所以不是端點失效）。DNS 也完全查不到記錄。

結論：

- **沒有任何舊流量、書籤或外部連結指向 `instantgig.tw`**，因此沒有東西需要 301 重導。
- 不需要為了「保留舊連結」去把它買下來。舊網域只出現在早期的程式註解與文件裡，已全部
  改成 `talent-core-pro.com`。
- 唯一還帶著 `instantgig.tw` 的是**管理員登入帳號** `admin@instantgig.tw`。它是登入識別碼，
  不是收信信箱，登入時只跟後端機密 `ROOT_ADMIN_PASSWORD` 比對，網域不存在不影響登入
  （見第 9 節）。也因為網域不存在，**這個位址永遠收不到信**——任何要寄信給管理者的功能
  都必須用 `support@talent-core-pro.com`。
- 本機儲存金鑰與 Realtime 頻道名稱仍以 `instantgig-` 開頭，那是使用者裝置上的資料鍵，
  改名等於清空既有資料，**不要改**。

**如果你之後真的註冊了 `instantgig.tw` 並想讓它導向新網域**，照這個順序做（不要把它加成
Worker 的 Custom domain，那樣兩個網址會同時提供同一份網站，等於重複內容）：

1. 在 Cloudflare 加入 `instantgig.tw` 這個 zone，把註冊商的 NS 換成 Cloudflare 給的兩台。
2. DNS → Records 加一筆**佔位記錄**並開啟 Proxied（橘雲）：`AAAA`、名稱 `@`、值 `100::`；
   `www` 再加一筆一樣的。沒有 Proxied 記錄，Redirect Rules 不會被執行。
3. Rules → **Redirect Rules** → Create，Single Redirect：
   - 比對：`(http.host eq "instantgig.tw") or (http.host eq "www.instantgig.tw")`
   - 動作：Dynamic → 運算式
     `concat("https://talent-core-pro.com", http.request.uri.path, http.request.uri.query != "" ? concat("?", http.request.uri.query) : "")`
   - 狀態碼 **301**、勾選 Preserve query string 以外的欄位不必動。
4. 驗證（三個都要通）：
   ```bash
   curl -sI https://instantgig.tw/            | head -n 5   # 301 → https://talent-core-pro.com/
   curl -sI https://www.instantgig.tw/gig/abc | head -n 5   # 301 → 同路徑
   curl -sI "https://instantgig.tw/?x=1"      | head -n 5   # 301 → 查詢字串保留
   ```
   看到 `HTTP/2 301` 與正確的 `location:` 才算完成。搜尋引擎需要幾週才會把索引換過去，
   期間**不要把舊網域改成 302 或關掉**。

注意事項：

- **兩個主機名稱都要加**，否則沒加的那個會顯示 Cloudflare 的錯誤頁。想讓 `www` 統一
  轉到不帶 www 的網址：Rules → **Redirect Rules** → Create，比對
  `hostname eq "www.talent-core-pro.com"`，動作 Dynamic → `concat("https://talent-core-pro.com", http.request.uri.path)`、
  狀態碼 301。這是選配，不設也能正常使用。
- 這些記錄必須是 **Proxied（橘雲）**。Workers 自訂網域一律經過 Cloudflare 代理，
  這也是 Access 能保護 `/admin` 的原因。
- 憑證由 Cloudflare 自動簽發，Domains & Routes 顯示 **Active** 即完成。
- 綁好自訂網域後，到同一頁把 `workers.dev` 路由關閉（Disable），避免同一份網站多一個
  沒被 Access 涵蓋的 `/admin` 入口。
- 想把管理平台放在自己的子網域（例如 `admin.talent-core-pro.com`）也可以：加第三個
  Custom domain 指到同一個 Worker，開 `admin.talent-core-pro.com/admin` 即可。
  但**同一個 Worker 服務的是同一份靜態網站**，子網域的根路徑仍是一般使用者網站，
  路徑分流無法靠 DNS 完成。

#### Cloudflare 儀表板的「訪客無法存取」提醒

新加入的 zone 還沒有任何記錄時，Cloudflare 概覽頁會出現這幾則提醒：

| 提醒                                              | 該怎麼做                                                       |
| ------------------------------------------------- | -------------------------------------------------------------- |
| 訪客無法存取 `talent-core-pro.com`（缺 A／CNAME） | **不要手動加 A／AAAA**。照本節加 Custom domain，記錄會自動建立 |
| 訪客無法存取 `www.talent-core-pro.com`            | 同上，`www` 再加一次 Custom domain                             |
| 電子郵件無法送達、可能被偽造（缺 MX／SPF）        | 與網站無關，見下方「網域信箱」                                 |

提醒本身不是錯誤，只是「這個 zone 目前沒有指向任何伺服器」。Workers 自訂網域沒有源站
IP 可填，手動建立的 A 記錄會指到錯的地方，也會讓自訂網域驗證卡在 Pending。順序一定是
**先部署 Worker → 再加 Custom domain**：Worker 不存在時 Domains & Routes 沒有東西可綁。

#### 網域信箱（選配，但建議處理防偽造）

- **不打算用 `@talent-core-pro.com` 收信**：Email → **DNS wizard** → 選「不需要在這個網域收信」，
  它會寫入 `v=spf1 -all`、`_dmarc` 的 `p=reject` 與空的 DKIM 記錄，讓別人無法冒用你的
  網域寄信。網站完全不受影響。
- **要收信**：最省事的是 Cloudflare **Email Routing**（免費，自動寫入 MX 並轉寄到你現有
  的信箱），但它**只能收轉、不能寄**；要能寄信得用 Google Workspace／Microsoft 365 等，
  依它們給的 MX、SPF、DKIM 記錄設定。
- 若第 7 節的 Access 政策用 `Emails ending in @talent-core-pro.com`，那些信箱必須真的收得到信，
  否則收不到一次性驗證碼。改用 `Emails` 逐筆填現有信箱（Gmail 等）就沒有這個依賴。
- `MX` 記錄不能開 Proxied，郵件主機的 A／CNAME 保持 **DNS only**。

### 4. 網頁版的路由行為

網頁與手機 App 跑同一份程式碼，差別只有管理平台的可用性（`lib/adminHost.ts` 的
`IS_ADMIN_PLATFORM_AVAILABLE`，只有 `Platform.OS === 'web'` 為真）：

- **網頁**：`/` 是任務牆，未登入可瀏覽任務與詳情；發布、投標、開啟對話會導到
  `/auth/sign-in`。`/admin` 是管理平台，未登入停在 `/admin/login`。
- **手機 App**：一般使用者介面相同；`app/admin/_layout.tsx` 一律 `Redirect` 回
  `/(tabs)`，App 內沒有任何管理入口。
- 兩套登入互不干擾：`components/AuthGate.tsx`（一般使用者的 bilt auth）對
  `/admin` 底下的路徑不生效，管理平台用自己的 `admin-auth` session token。
- 因為是單頁匯出，分頁標題與 robots 標記由 `public/index.html` 提供（一般使用者網站的
  版本）；進入 `/admin` 時 `app/admin/_layout.tsx` 於執行階段換成管理平台標題與
  `noindex`，離開時還原。
- `/admin-dashboard` 是舊路徑，網頁上導向 `/admin/dashboard`，原生導回 `/(tabs)`。

正式行為驗證：`npm run build:web` 後用 `npm run serve:web` 開 `dist/`，
`/` 應該看到任務牆，`/admin` 應該看到管理員登入頁。

### 5. 其他主機（備用設定）

| 平台       | 設定檔              | 說明                                                                                                                              |
| ---------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 自架 Nginx | `deploy/nginx.conf` | 複製 `dist/` 到 `/var/www/talent-core-pro/`，調整 `server_name` 與憑證路徑；`/admin` 有獨立的 `noindex` 與 `X-Frame-Options` 區塊 |

`public/_redirects` 與 `public/_headers` 是 Cloudflare 格式（Workers 靜態資產與 Pages 都讀
同一份，Netlify 也相容），換主機時只要確認該主機支援這兩個檔案，或改用該主機自己的設定方式。

因為是單頁輸出，任何主機都必須把未命中檔案的路徑改寫回 `index.html`，
否則直接開 `/gig/xxx` 或 `/admin/login` 會 404。Cloudflare 這邊是靠 `wrangler.toml` 的
`assets.not_found_handling = "single-page-application"`（不是 `_redirects` 的 catch-all —
Cloudflare 的轉址規則就算命中真實檔案也會執行，catch-all 會蓋掉 `/_expo/` 的 JS bundle）。

### 6. 把 `talent-core-pro.com` 的 DNS 轉到 Cloudflare（DNS 已在 Cloudflare 就跳過本節）

> **2026-08-20 實測：這一節可以跳過。** 註冊資料顯示 `talent-core-pro.com` 的註冊商就是
> Cloudflare（註冊日 2026-08-09），name server 是 `damien.ns.cloudflare.com` 與
> `leah.ns.cloudflare.com`，DNS 已由 Cloudflare 託管。同時 `@` 與 `www` 都還查不到任何
> A／CNAME 記錄，所以網站目前開不起來——缺的是第 2 節的部署與第 3 節的 Custom domain。

Cloudflare 的自訂網域與 Cloudflare Access 都需要網域的 DNS 由 Cloudflare 託管。
這裡是**轉 DNS 託管**，不是轉移網域註冊商：網域仍留在原註冊商
（HiNet／PChome／Gandi／GoDaddy 等），只把「由誰回答 DNS 查詢」換成 Cloudflare，不影響
網域到期日與續費對象。

**步驟 0：先備份現有 DNS 記錄（最重要）**

到目前的 DNS 供應商後台，把所有記錄抄下來或匯出 zone file，尤其是這些容易被忘記、
一漏就出事的：

| 記錄                     | 影響                                  |
| ------------------------ | ------------------------------------- |
| `MX` + `TXT`(SPF/DKIM)   | 漏掉會直接收不到／寄不出信            |
| `TXT` `_dmarc`           | 郵件驗證                              |
| `CNAME` 第三方驗證用記錄 | Google Search Console、金流、憑證驗證 |
| 其他子網域 A／CNAME      | 舊站、測試環境、郵件主機              |

同時把主要記錄的 **TTL 調低到 300 秒**，等 1～2 小時再往下做，切換時的空窗會更短。

**步驟 1：在 Cloudflare 新增網域**

1. 註冊／登入 Cloudflare → Add a site → 輸入 `talent-core-pro.com`。
2. 方案選 **Free**。
3. Cloudflare 會自動掃描現有記錄。掃描不保證完整，**逐筆比對步驟 0 的清單**，缺的手動補上。
4. 網站上線用的記錄不用手動建：轉移完成後在 Worker 加自訂網域（第 3 節），
   Cloudflare 會自動寫入 apex 與 `www` 的 CNAME。
5. 這個階段其他記錄先維持與舊供應商一致即可；郵件與第三方驗證記錄照抄，不要改成 Proxied。

**步驟 2：關閉舊供應商的 DNSSEC**

若舊供應商有開 DNSSEC，一定要先在**註冊商後台移除 DS 記錄**並等它失效，才換
nameserver；否則 DNSSEC 驗證會失敗，網域會整站解析不到。之後要在 Cloudflare 重新啟用
DNSSEC，是 DNS → Settings → DNSSEC → Enable，再把 Cloudflare 給的 DS 值填回註冊商。

**步驟 3：在註冊商改 nameserver**

Cloudflare 會給兩筆專屬 nameserver（形如 `xxx.ns.cloudflare.com`）。到註冊商後台的
「名稱伺服器／DNS 設定」把原本的兩筆換成這兩筆，只留 Cloudflare 的。

`.tw` 網域的實務差異：

- 多數 `.tw` 註冊商（HiNet、PChome、Gandi 等）都支援自訂 nameserver，但入口名稱不一，
  可能叫「DNS 代管設定」、「名稱伺服器變更」或需要另外申請。
- 部分 `.tw` 註冊商的 nameserver 變更**不是即時生效**，需人工審核或每日批次更新，
  實際可能等 1～24 小時；TWNIC 端更新後全球快取還要再等舊 TTL 過期。
- 若註冊商要求填 nameserver 的 IP（glue record），Cloudflare 的 nameserver 不需要也不該填，
  留空即可。

**步驟 4：等生效並驗證**

Cloudflare 的 Overview 顯示 **Active** 就是生效了（通常數小時內，最長 24 小時，
Cloudflare 也會寄信通知）。生效後檢查這幾件事：

```sh
# nameserver 是否已指向 Cloudflare
dig NS talent-core-pro.com +short

# 網站主機名稱是否解得到
dig talent-core-pro.com +short
dig www.talent-core-pro.com +short

# 郵件記錄有沒有漏
dig MX talent-core-pro.com +short
dig TXT talent-core-pro.com +short
```

再用瀏覽器實測 `https://talent-core-pro.com` 會看到任務牆、`https://talent-core-pro.com/admin`
會看到管理員登入頁，Worker 的 Domains & Routes 顯示 **Active**。
**寄一封測試信到你的網域信箱**確認郵件沒斷。

**步驟 5：設定 SSL 與開始接 Access**

1. Cloudflare → SSL/TLS → Overview → 選 **Full (strict)**（不要用 Flexible，會造成無限轉址）。
2. apex 與 `www` 保持 **Proxied（橘雲）**，這是 Workers 自訂網域的正常狀態。
3. 接著照第 7 節在 `talent-core-pro.com` 的 `/admin` 路徑上設定 Cloudflare Access
   （**不要**保護整個網域，否則一般使用者也會被要求驗證）。

**容易踩到的地雷**

- **漏抄 MX／SPF**：這是轉 DNS 最常見的事故，信會直接掉。務必在切換前抄完、切換後測試。
- **舊供應商別馬上退租**：nameserver 生效前舊區域還在服務，至少留一週再關閉。
- **郵件與驗證記錄不要開 Proxied**：`MX` 不能代理，郵件主機的 A／CNAME 保持 DNS only。
- **自訂網域驗證中先別動 DNS**：Cloudflare 自動建立的 CNAME 不要改成 DNS only 或改值，
  否則自訂網域會退回 Pending。
- **Cloudflare 的 Email Routing 若沒要用就別開**，它會改寫 MX 記錄。
- **轉 DNS ≠ 轉註冊商**：如果你之後想把註冊也搬到 Cloudflare Registrar，`.tw` 目前
  **不在 Cloudflare Registrar 支援的 TLD 清單內**，註冊只能留在原註冊商，DNS 託管在
  Cloudflare 即可。

### 7. 用 Cloudflare Access 保護 `/admin`（建議，免費）

`/admin` 可以用 Cloudflare Zero Trust 的 **Access** 在邊緣多加一道驗證：免費方案含 50 位
使用者。Access 與管理員帳密是互補的兩層 —— Access 決定「誰能直接開到管理入口」，
管理員帳密與角色（第 9 節）決定「登入後能做什麼」。

> **先讀這段，它會影響你的期待**：網站是單頁匯出（SPA）。Access 只能擋住
> **對 `/admin` 的整頁請求**（輸入網址、書簽、重新整理）。使用者若先開 `/` 再由前端
> 路由切到 `/admin`，瀏覽器不會再向伺服器要一次文件，Access 也就不會介入 —— 這種情況
> 他會看到管理員登入頁，但仍必須有正確帳密才能登入，而且每個管理動作都在後端函式
> 重新驗證 session token 與角色權限。
> 想要「連管理介面都看不到」的硬隔離，必須把管理平台拆成另一個獨立網域的建置，
> 目前不是這個專案的架構。

**不要**再用「保護整個 Worker」（Workers & Pages → Access 分頁 → Protect this Worker
behind Access / All traffic）：那會連一般使用者網站一起鎖住，訪客也要收驗證碼才能開任務牆。

**共同前置**：Cloudflare 儀表板 → Zero Trust → 選 Free 方案（需綁信用卡，50 位使用者內
不收費）→ 設定 team 名稱（會產生 `<team>.cloudflareaccess.com`）。接著到
Zero Trust → Settings → Authentication → Login methods，確認 **One-time PIN**
（Email 驗證碼）已啟用；要用 Google 帳號登入就再新增 Google identity provider。

**設定步驟（Self-hosted application，只綁 `/admin` 路徑）**

前置條件：`talent-core-pro.com` 的 DNS 由 Cloudflare 託管（第 6 節），且自訂網域在 Worker 的
Domains & Routes 顯示 **Active**（Workers 自訂網域一律 Proxied，Access 才保護得到）。

1. Zero Trust → Access → Applications → **Add an application** → **Self-hosted**。
2. Application name：`Talent Match Admin`；Session Duration：`24 hours`。
3. Public hostname：Domain `talent-core-pro.com`、**Path** 填 `admin`。
   再用 **Add a public hostname** 補上這幾筆，漏掉的入口不受保護：
   - `talent-core-pro.com` + path `admin/*`
   - `talent-core-pro.com` + path `admin-dashboard`
   - 有綁 `www` 的話，同樣三筆再加一次
4. 新增 Allow 政策：Policy name `Admin allowlist`、Action **Allow**、Include → Selector
   `Emails` 逐筆填信箱（或 `Emails ending in` → `@talent-core-pro.com`）。存檔後不要再加
   Bypass 政策。建議這份名單與 `admin_accounts` 的管理員信箱一致，離職時兩邊一起移除。
5. SSL/TLS → Overview → 選 **Full (strict)**。
6. `workers.dev` 路由與預覽網址不會被這個應用程式涵蓋（主機名稱不同）。到 Worker →
   Settings → Domains & Routes 把 `workers.dev` Disable、Preview URLs 關閉，
   或把那些主機名稱也加進同一個應用程式。

#### 驗證是否生效

用**無痕視窗**逐項確認：

| 測試                                       | 預期                                              | 失敗代表                                    |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------- |
| 開 `https://talent-core-pro.com/`          | 直接看到任務牆，**沒有**任何驗證畫面              | Access 套到整個 Worker 或整個網域了         |
| 直接開 `https://talent-core-pro.com/admin` | 先出現 Cloudflare 驗證畫面，收信輸入 6 位碼才進入 | 這個主機名稱／路徑沒被應用程式涵蓋          |
| 通過驗證後                                 | 才看到管理員登入頁，仍需輸入管理員帳密            | 應用程式設成 Bypass                         |
| 登入頁／主控台                             | 顯示「Cloudflare Access 已驗證」與你的信箱        | 身分端點沒回 JSON（保護可能仍有效，見下方） |
| 直接開 `/cdn-cgi/access/get-identity`      | 回傳含 `email` 的 JSON                            | 同上                                        |
| 用不在白名單的信箱驗證                     | 顯示拒絕存取                                      | 政策範圍太寬（例如 Email domain 填錯）      |
| 開 `instantgig.<子網域>.workers.dev/admin` | 同樣要求驗證，或該路由已 Disable                  | 沒加該 hostname，也沒關掉這個入口           |
| 主控台 →「登出並結束 Cloudflare 連線」     | 導向 Cloudflare 登出頁，再開 `/admin` 要重新驗證  | `/cdn-cgi/` 被其他規則攔截                  |

應用內對應行為（已實作）：

- `hooks/useAccessIdentity.ts` 會讀取 Cloudflare 的 `/cdn-cgi/access/get-identity`，
  在管理主控台與登入頁顯示「Cloudflare Access 已驗證」與該信箱；沒有 Access 保護時
  自動隱藏，不影響本機或 `workers.dev` 直連的行為。
- 管理主控台的登出改為兩個選項：僅登出管理帳號（撤銷後端 session token），或連同
  Cloudflare 連線一起結束（導向 `/cdn-cgi/access/logout`，下次進入要重新驗證）。
- `/cdn-cgi/` 由 Cloudflare 邊緣處理，不會進到靜態資產的 SPA fallback，也不受
  `public/_redirects` 影響。
- 「Cloudflare Access 已驗證」橫幅只是提示，**不是保護是否生效的判斷依據** ——
  真正的判斷是「未驗證的無痕視窗能不能直接開 `/admin`」。

需要自動化（監控、E2E 測試）通過 Access 時，用 Zero Trust → Access → Service Auth 建立
Service Token，並在該應用程式加一條 `Service Auth` 政策，請求帶
`CF-Access-Client-Id` / `CF-Access-Client-Secret` 標頭即可。

### 8. 搜尋引擎與存取

- **一般使用者頁面允許收錄**：`public/robots.txt` 是 `Allow: /`，
  `public/index.html` 帶 `<meta name="robots" content="index, follow">`、網站標題、
  描述與 Open Graph 標記。
- **`/admin` 一律不收錄**，三層一起擋：`robots.txt` 的 `Disallow: /admin`
  （前綴比對，同時涵蓋 `/admin/login` 與舊路徑 `/admin-dashboard`）、
  `public/_headers` 讓 `/admin`、`/admin/*`、`/admin-dashboard` 的回應帶
  `X-Robots-Tag: noindex, nofollow` 與 `X-Frame-Options: DENY`、
  以及 `app/admin/_layout.tsx` 在進入管理路徑時把頁面的 robots meta 改成 `noindex`
  （離開時還原），涵蓋只讀執行後 DOM 的爬蟲。
- **SEO 的實際限制**：`web.output` 是 `'single'`，所有路徑回傳同一份 `index.html`，
  因此每個頁面的標題與描述都一樣，也沒有 sitemap。要做逐頁標題、描述與預覽圖，
  需改成 `static` 匯出（`app/+html.tsx` 才會生效），那是另一項工程。
- **Open Graph 分享預覽**：`public/index.html` 已帶 `og:image`（絕對網址
  `https://talent-core-pro.com/icons/talentmatch-icon.png`，1024×1024 方形，Facebook／LINE
  會顯示為方形縮圖）與 Twitter card。想要 1200×630 的橫幅預覽圖，放一張到
  `public/icons/` 並改 `og:image` 與 `og:image:width` / `og:image:height`，
  `twitter:card` 同時改成 `summary_large_image`。
  **`og:url` 與 `<link rel="canonical">` 刻意沒有加**：單頁匯出下所有路徑回傳同一份
  HTML，填固定值會讓別人分享的 `/gig/<id>` 連結被導回首頁，也等於告訴爬蟲每個路徑
  都是首頁的重複內容。這兩個標記要等改成 `static` 逐頁匯出才有意義。
- **存取關卡**：一般使用者網站是公開的（本來就要公開）；`/admin` 有
  Cloudflare Access（路徑層，見第 7 節）與管理員帳密（伺服器端驗證，見第 9 節：
  帳號存在資料庫、密碼以 PBKDF2 雜湊、連續 5 次失敗鎖 5 分鐘）。

### 9. 管理員帳號、密碼與權限

帳密**不在程式碼裡**。驗證全部在後端函式 `admin-auth`（bilt-cloud edge function）進行，
前端只持有一組隨機 session token。

**資料表**（RLS 沒有任何政策，anon key 讀不到任何一列，只有函式的 service key 能存取）

| 資料表               | 內容                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| `admin_accounts`     | 信箱、顯示名稱、角色、`password_hash`、一次性啟用碼、啟用狀態、失敗次數與鎖定時間 |
| `admin_sessions`     | token 的 SHA-256、對應管理員、到期時間（12 小時，每次驗證會延長）                 |
| `admin_login_events` | 登入成功／失敗／鎖定／改密碼等事件，供帳號管理頁顯示                              |

密碼以 **PBKDF2-SHA256（210,000 輪 + 16 bytes 隨機 salt）** 雜湊，格式為
`pbkdf2-sha256$<輪數>$<salt>$<hash>`；驗證用常數時間比較。資料庫外洩也拿不到明文，
更拿不到可直接使用的 token。

**在畫面上管理帳號（日常做法）**

以總管理員登入 → 主控台 → **管理員帳號管理**（`app/admin/accounts.tsx`）：

- **新增管理員**：填信箱、顯示名稱、角色。初始密碼欄**建議留空**，系統會產生一次性
  啟用碼（例如 `K7QM-3F9T-XPWR`，14 天有效）。把啟用碼交給對方，對方在登入頁的密碼欄
  輸入啟用碼 → 系統要求他設定自己的新密碼 → 啟用碼即失效。這樣你不會知道對方的密碼。
- **改角色**：直接切換該帳號的角色，對方的登入狀態會立刻被撤銷，需重新登入。
- **停用／啟用**：停用會撤銷所有 session，帳號無法登入（保留紀錄）。不能停用自己，
  也不能讓平台失去最後一位啟用中的總管理員。
- **重設密碼**（忘記密碼時用）：清除該帳號密碼並產生新啟用碼，同時撤銷其所有 session。
- **刪除帳號**：不能刪自己，也不能刪最後一位啟用中的總管理員。
- **變更我的密碼**：需輸入目前密碼；成功後其他裝置上的 session 全部失效。
- 頁面下方是伺服器端的**登入紀錄**（含密碼錯誤與鎖定事件）。

**固定總管理員（改不掉的那一個）**

登入帳號 **`admin@instantgig.tw`**，密碼存在後端加密機密 `ROOT_ADMIN_PASSWORD`，
帳號名稱存在 `ROOT_ADMIN_EMAIL`。這個帳號**刻意沒有網域搬遷的問題**：它是登入識別碼，
不是收信信箱，網站換網域不需要跟著改（真要改就得同步更新 `ROOT_ADMIN_EMAIL` 機密，
否則會登不進去）。

- 密碼**不在資料庫裡**：`admin_accounts` 這一列的 `password_hash` 永遠是空的，
  登入時只跟機密比對。資料庫外洩也拿不到它。
- 平台上改不動它：不能改角色、不能停用、不能刪除、不能被別人重設密碼，本人也不能在
  平台變更密碼。畫面上會顯示「固定・不可變更」。資料庫另有限制條件保證它永遠是
  啟用中的總管理員，且全表最多一個受保護帳號。
- **忘記密碼**：不必進資料庫，更新 `ROOT_ADMIN_PASSWORD` 機密後直接用新密碼登入。
- 任何管理員都不能變更自己的角色（這正是先前唯一的總管理員被誤降級、平台被鎖死的原因）。

**其他兩個內建帳號**

`review@instantgig.tw`（審核專員）與 `data@instantgig.tw`（數據分析員）目前沒有密碼。
要啟用它們：以固定總管理員登入 → 管理員帳號管理 → 對該帳號按「重設密碼」取得新的
一次性啟用碼，對方在登入頁的密碼欄輸入啟用碼後設定自己的密碼。
新密碼規則：至少 10 個字元，且要有英文與數字。

**角色與權限**

| 權限                  | 總管理員 owner | 審核專員 moderator | 數據分析員 analyst |
| --------------------- | -------------- | ------------------ | ------------------ |
| AI 認證複審與檢舉處理 | ✓              | ✓                  |                    |
| 檢視使用者總表        | ✓              | ✓                  | ✓                  |
| 封禁、解禁與帳號備註  | ✓              | ✓                  |                    |
| 任務下架與內容管理    | ✓              | ✓                  |                    |
| 檢視訂閱與營收帳務    | ✓              |                    | ✓                  |
| 開通、取消與退款訂閱  | ✓              |                    |                    |
| 系統公告與推播        | ✓              |                    |                    |
| 稽核與登入紀錄        | ✓              | ✓                  | ✓                  |
| 執行系統維護排程      | ✓              |                    |                    |
| 管理員帳號管理        | ✓              |                    |                    |

- 主控台只列出該角色可用的模組；直接輸入沒權限的網址會看到「權限不足」畫面
  （`app/admin/_layout.tsx` 的 `ROUTE_PERMISSION`）。
- 頁面內的破壞性動作另有第二層判斷，沒權限時按鈕換成唯讀提示
  （`components/admin/ReadOnlyNotice.tsx`）。
- 要調整角色能做什麼：改 `lib/adminPermissions.ts` 的 `ADMIN_ROLE_PERMISSIONS`。
  介面權限以這份表為準；後端函式另有一份最小權限表，只用來守自己負責的動作
  （帳號管理限 owner、登入紀錄限有稽核權限者）—— 新增涉及後端的權限時兩邊都要改。

**這樣安全嗎**

- 密碼不再出現在 JS bundle 裡，改前端狀態也拿不到有效 token（token 由伺服器簽發並存 hash）。
- 剩下的風險是「拿到有效 token 的瀏覽器」：token 存在 `AsyncStorage`／localStorage，
  12 小時未使用即過期，改密碼或被停用會立刻失效。要更嚴格就縮短
  函式裡的 `SESSION_HOURS`。
- 一般使用者的資料（任務、提案、對話、評價、收藏、通知）都在後端且受 RLS 保護；
  但管理頁的封禁、訂閱帳務與公告推播仍是管理端本機狀態，只影響開啟該頁的瀏覽器。
  要讓那些動作對所有使用者生效，得先把它們也搬上後端。
- 不要把啟用碼與登入網址寫在同一封信裡；離職時同步移除 `admin_accounts` 的帳號與
  Cloudflare Access 白名單。

### 10. 每日一次系統自動維護

維護分兩側，各自每天執行一次，互不影響。

**手機 App（裝置端）**

- 觸發時機：開啟 App、從背景回到前景、App 長時間開著跨日（`components/MaintenanceRunner.tsx`）。
  同一天只會真的執行一次，判斷依據是台北時區日期（`lib/maintenance.ts` 的 `taipeiDayKey`）。
- 維護內容：逾期 14 天未成交的任務自動結案、免費對話配額月度重置檢查、
  通知中心保留最近 30 天已讀通知（未讀一律保留，總量上限 80 則）、檢查 App 是否有新版本。
  通知已上雲，這項清理只會影響登入者自己帳號的通知；未登入時會回報略過。
  （對話訊息的修剪在伺服器端，裝置端只會回報「由伺服器排程負責」。）
- 使用者可在「帳戶 → 系統維護」（`app/maintenance.tsx`）看到上次維護時間、每項結果、
  最近 20 次紀錄，也能手動再跑一次。
- 版本更新：原生走 `expo-updates`（開發模式與 Expo Go 的 `Updates.isEnabled` 為 false，
  會回報略過；要真的收到更新需先在 EAS 設好更新通道）。網頁走 service worker
  （`npm run build:pwa` 產生的 `sw.js`），開發伺服器沒有註冊 service worker 所以一律略過。

**伺服器端（管理平台）**

- 函式：`daily-maintenance`（`verify_jwt=false`）。維護內容：清除過期的 `admin_sessions`、
  解除到期的帳號鎖定、清理 90 天前的 `admin_login_events`、
  每則對話保留最近 200 條訊息（`prune_chat_messages`）、清理 180 天前的 `maintenance_runs`。
- 紀錄寫進 `maintenance_runs`（RLS 開啟且沒有政策，只有函式的 service key 能讀寫），
  管理平台「每日系統維護」頁（`app/admin/maintenance.tsx`）可檢視，需要 `audit:view`；
  手動執行需要 `maintenance:run`（預設只有 owner）。
- 每日去重：同一個台北日期已有 `ok`／`partial` 紀錄就直接回報已完成，
  只有 `force: true`（頁面上的「仍要重新執行」）會重跑。

**設定外部排程（讓它不必等管理員登入）**

1. 以 owner 登入管理平台 → 每日系統維護 → 排程設定，複製呼叫網址與排程金鑰
   （金鑰存在 `maintenance_config`，第一次開啟頁面時自動產生，可隨時「重新產生」）。
2. 在任何每日排程服務（例如 cron-job.org、GitHub Actions 排程、自己的伺服器 crontab）
   設定每天呼叫一次：

```sh
curl -X POST "https://<project>.cloud.bilt.me/functions/v1/daily-maintenance" \
  -H "content-type: application/json" \
  -H "x-maintenance-key: <排程金鑰>" \
  -d '{"action":"run"}'

# 只能發 GET 的排程服務可以改用：
curl "https://<project>.cloud.bilt.me/functions/v1/daily-maintenance?key=<排程金鑰>"
```

3. 也可以改用環境變數金鑰：在專案 secrets 加 `MAINTENANCE_CRON_KEY`，函式會同時接受它。
4. 排程建議設在離峰時段（例如台北時間 04:00）。重複呼叫是安全的，同一天不會重跑。

## 11. 任務與提案的雲端資料（gigs / bids）

任務與提案已經不在裝置上，改存 bilt-cloud Postgres，所有使用者看到的是同一份資料。

### 資料表與權限

| 資料表 | 誰讀得到                                                                                                           | 誰寫得到                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `gigs` | 已通過認證且未下架的任務所有人（含未登入訪客）都讀得到；發案者與承接人才另外讀得到自己的待複審、被退回與已下架任務 | 只有 `client_id = auth.uid()` 的本人可以新增與修改 |
| `bids` | 示範提案所有人可見；其餘只有投標的人才本人與該任務的發案者可見                                                     | 只有 `talent_id = auth.uid()` 的本人可以新增與修改 |

- 共用示範資料以 `is_demo = true` 標記，`client_id` / `talent_id` 為 `null`（不屬於任何帳號，任何人都不能改）。
- `bids` 的可見性需要查 `gigs`，政策不可直接子查詢（會造成 42P17 無限遞迴），改用 `SECURITY DEFINER` 的 `is_gig_client(gid)`。
- 跨角色的狀態轉移不靠 RLS（RLS 無法限制「只能改哪些欄位」），改走資料庫函式：
  - `accept_bid(bid_id)`：接受提案、退回其他待處理提案、指派任務。
  - `mark_gig_talking(gid)`：人才開啟對話時把任務推進到「對話中」。
  - `close_stale_gigs(max_age_days)`：逾期未成交自動結案（裝置端每日維護與伺服器排程共用同一份規則）。

### 自動更新（Realtime）

`lib/remote/live.ts` 同時做三件事：訂閱 `gigs` / `bids` 的 `postgres_changes`、監聽 broadcast 事件（本機寫入成功後會廣播）、每 20 秒輪詢一次並在 App 回到前景時補讀。

**目前這個專案的資料庫 `wal_level` 是 `replica`**，Realtime 的 `postgres_changes` 需要 `logical` 才會推送資料列變更，因此實際生效的是輪詢與前景補讀（最慢 20 秒看到新內容）。等資料庫開啟邏輯複製後，同一份程式碼就會自動變成即時推送，不需要改任何東西。

### 管理平台

RLS 讓一般用戶端讀不到待複審與已下架的內容，因此管理平台改走 `admin-content` 邊緣函式（service key + 管理員 session token）：`list`、`takedown-gig`、`restore-gig`、`gig-review`、`bid-review`、`list-chats`、`resolve-report`。權限沿用角色表（下架需 `gigs:manage`、複審與對話紀錄需 `review:manage`）。

## 12. 對話與訊息的雲端資料（conversations / messages）

對話已跨裝置：訊息存在 bilt-cloud，登入同一個帳號的任何裝置都看得到同一份對話。

### 資料表與權限

| 資料表          | 誰讀得到                                                 | 誰寫得到                              |
| --------------- | -------------------------------------------------------- | ------------------------------------- |
| `conversations` | 只有 `client_id` 或 `talent_id` 等於 `auth.uid()` 的兩方 | **沒有人**（只能經由資料庫函式寫入）  |
| `messages`      | 同上（`client_id` / `talent_id` 是冗餘欄位，避免連表）   | **沒有人**（只能經由 `send_message`） |

這兩張表刻意不給 `INSERT` / `UPDATE` / `DELETE` 政策：RLS 只能限制「哪些列」，不能限制「欄位填什麼值」。若開放直接寫入，任何人都能替別人硬開一組對話、偽造 `sender_id`，或把命中詐騙關鍵字的訊息直接標成 `clean` 繞過審核。所有寫入因此走 `SECURITY DEFINER` 函式：

- `start_conversation(gid, tid)`：驗證呼叫者是該任務的發案者或那位人才本人、任務未下架且已通過認證、雙方不同人，並從任務帶出客戶資料。同一組（任務、人才）重複呼叫會回傳既有對話 id。示範任務（`is_demo`）沒有真實帳號，一律回傳 `null`。
- `send_message(cid, body)`：伺服器決定 `sender_id`、送出者名稱與審核判定（`chat_scam_keywords()` / `chat_flagged_terms()`，比對前先去掉所有空白），同一句 SQL 內順便更新對話的最後訊息與送出者自己的已讀時間。
- `mark_conversation_read(cid)` / `report_conversation(cid, reason)`：只有對話雙方可呼叫。
- `chat_unread_counts()`：我的未讀數（對方送出且晚於我的已讀時間），依對話分組。
- `prune_chat_messages(keep)`：每則對話保留最近 200 條，由伺服器每日維護排程執行。

**聊天審核的關鍵字字典有兩份**：伺服器的 `chat_scam_keywords()` 是判定依據，`lib/moderation.ts` 的 `SCAM_KEYWORDS` 只用於裝置端即時提示與管理端高亮，兩邊要一起改。

### 自動更新（Realtime）

對話這裡的即時性靠 **broadcast**，broadcast 不需要邏輯複製，所以在 `wal_level = replica` 的現況下就能立刻送達：送出訊息的裝置在 `instantgig-chat` 頻道廣播 `{conversationId, clientId, talentId}`，其他裝置收到後**回資料庫重讀**（廣播內容可被偽造，絕不能直接當訊息顯示；重讀會經過 RLS）。另外一併訂閱 `postgres_changes`（等資料庫開邏輯複製自動生效），並保底輪詢：對話清單 20 秒、正打開的那則對話 6 秒，App 回到前景也會補讀。

### 未讀與示範內容

- 未讀數來自 `client_last_read_at` / `talent_last_read_at`，對話分頁會顯示紅點與數字，進入對話即標記已讀。
- 雲端對話需要兩個真實帳號，因此 **28 筆示範任務與示範人才無法開啟對話**，畫面會直接說明原因。
- 對話上雲前留在裝置上的 `instantgig-chat`、`instantgig-notifications`、`instantgig-saved`、`instantgig-reviews` 紀錄會在啟動時清除（內容已改由帳號保存）。

### 評價、收藏與通知中心（帳號資料）

這三份資料在 bilt-cloud，擁有者是帳號而不是裝置，所以登出再登入、或換一支手機登入同一個 Email 都還在。訪客可以瀏覽任務牆與人才檔案上的評價，但**收藏與通知中心需要登入**（按下收藏會導向登入頁）。

| 資料表          | 誰讀得到                                               | 誰寫得進去                                                                |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `reviews`       | 所有人（含訪客）——評價會顯示在對方公開檔案並計入信任度 | 只能寫自己的（`author_id = auth.uid()`），而且必須通過 `can_review_gig()` |
| `saved_gigs`    | 只有本人                                               | 只有本人（沒有 UPDATE 政策，重複收藏走 ON CONFLICT DO NOTHING）           |
| `notifications` | 只有本人                                               | 只有本人（每則通知都由收件人自己的裝置寫入）                              |

`can_review_gig(gid, target)` 是 SECURITY DEFINER 函式（政策不可直接子查詢 `gigs`，會 42P17 遞迴）：任務必須 `status = 'completed'`、非示範資料，而且呼叫者是發案者、對象是承接人才，或反過來。實測結果：客戶→人才 true、人才→客戶 true、不相關帳號 false、未完成的任務 false、訪客 false。因此無法對陌生人留評價。`(gig_id, author_id)` 有唯一索引，重新評價會覆蓋原本那一則。

實作位置：`lib/remote/{reviews,saved,notifications}.ts` 負責讀寫，`lib/stores/{reviews,saved,notifications}.ts` 是雲端快取（不再 persist 到 AsyncStorage）。收藏與通知的擁有者由 `components/CloudSync.tsx` 依登入狀態呼叫 `setOwner()` 設定，空字串代表訪客，此時 store 不讀寫雲端。同步節奏跟任務牆一樣：20 秒輪詢、廣播事件與回到前景時補讀。

示範人才（`talent_seed_*`）的歷史評價仍在 `lib/seed.ts` 的 `SEED_REVIEWS`，由 store 合併顯示：那些人才不是帳號、也沒有對應任務，寫進資料庫就得讓 `gig_id` 與雙方 id 可為空並加示範旗標，會削弱上面那道寫入檢查。

登出時 `resetLocalUserData()`（`lib/localData.ts`）**不刪任何內容**，只清掉快取、撤掉系統通知匣的橫幅與紅點，再以新身分重讀一次。

### 尚未上雲的部分

推播開關（`pushPrefs`）刻意留在裝置上（那是裝置設定不是個人內容）；封禁、訂閱帳務與公告推播的管理動作也還是管理端本機狀態。

## How can I make changes to my app?

**Via Bilt (Easiest)**

Visit your [Bilt Project](https://app.bilt.me/agent/3a907fd0-a0ca-4468-b6e6-cc0015e74de0) and send a message describing what you want:

- "Add a dark mode toggle"
- "Change the button color to blue"
- "Add a new screen for user settings"
- "Fix the navigation bar spacing"

Bilt understands natural language and updates your app automatically.

**Via Code**

Export the source, make changes in your IDE, and test locally with `npx expo start`.

## Can I use this with the MCP protocol?

Yes! Bilt is available as a remote MCP server at `https://mcp.bilt.me/mcp`.

Connect any MCP-compatible AI agent (Claude Desktop, OpenClaw, etc.) to programmatically build and modify mobile apps.

**Example MCP integration:**

```json
{
  "mcpServers": {
    "bilt": {
      "transport": {
        "type": "sse",
        "url": "https://mcp.bilt.me/mcp/sse",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    }
  }
}
```

Read more:

- [Bilt MCP Documentation](https://bilt.me/docs)
- [MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.buildingapplications%2Fmcp/versions/latest)

## Need help?

- 📚 [Bilt Documentation](https://bilt.me/docs)
- 💬 [Discord Community](https://discord.gg/3FqNgmSYdZ)
- 🐦 [Twitter Updates](https://twitter.com/biltmeanapp)
- 📧 Email: support@bilt.me

---

<div align="center">

**Built by AI. No code required.** ✨

[Try Bilt](https://bilt.me) • [View Docs](https://bilt.me/docs) • [Docs MCP Server](https://bilt.me/docs/mcp)

</div>
