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

## 網頁版（管理平台）靜態匯出與部署

**網頁版就是管理員專屬平台**（`app/admin/`）：一般使用者介面只在手機 App（iOS／Android）上
執行，網頁上完全不提供。任何非 `/admin` 的網址都會被 `components/WebAdminGate.tsx`
導到管理入口，未登入則停在 `/admin/login`。網站本體是這個 Expo 專案以
`web.output: 'single'`（SPA）匯出的靜態網站，整站都不允許被搜尋引擎收錄。

### 0. 最少步驟上線（全在瀏覽器，不用碰 DNS）

只是想先讓網站上線、拿到一個能分享的網址，照下面三步就夠了。第 3、6、7 節都是選配，
晚點再做也不影響已經上線的網站。

前置：程式碼要在 GitHub（在 Bilt 專案設定裡把專案連到 GitHub，一次性動作）。

1. Cloudflare 儀表板 → **Compute (Workers)** → Create → **Import a repository**
   → 授權後選這個 repo。
2. 只填這幾欄，其他保持預設，**環境變數可以先不設**：
   - Project name：`instantgig`（要與 `wrangler.toml` 的 `name` 一致）
   - Build command：`npm run build:web`
   - Deploy command：`npx wrangler deploy`（預設值，不用改）
3. 按 **Create and deploy**，等狀態跑到 Success。網址就是
   `https://instantgig.<你的子網域>.workers.dev`，打開會直接進管理員登入頁。

之後每次改動同步到 GitHub，Cloudflare 會自動重新建置並部署，不需要再進儀表板。

輸出目錄與 SPA fallback 都寫在 `wrangler.toml` 的 `[assets]`（`directory = "./dist"`、
`not_found_handling = "single-page-application"`），所以儀表板不用填輸出目錄。

上線後可以晚點再處理的兩件事：

- **沒設環境變數不會壞**：`EXPO_PUBLIC_BILT_URL` 與 `EXPO_PUBLIC_BILT_ANON_KEY` 缺少時，
  發布內容的 AI 審核會自動改用裝置端規則檢查，其餘功能不受影響（資料本來就存在裝置上）。
  想改用伺服器端審核，照第 2 節第 5 步補上兩個變數再重新部署。
- **整站只有管理員帳密保護**：`workers.dev` 網址是公開的，任何人開都會看到管理員登入頁。
  想在網域層再加一道驗證是第 7 節。

### 1. 本機匯出

```sh
npm ci

# 後端連線資訊會在建置時寫進 bundle；不設也能建置與執行，
# 只是 AI 審核會退回裝置端規則檢查
export EXPO_PUBLIC_BILT_URL="https://<project-id>.cloud.bilt.me"
export EXPO_PUBLIC_BILT_ANON_KEY="<anon-key>"

npm run build:web       # 輸出到 dist/
npm run serve:web       # 以 SPA 模式在 http://localhost:4173 預覽
```

`npm run build:pwa` 會在匯出後額外產生 `dist/sw.js`（Workbox 離線快取），
需要可安裝的 PWA 時再用。

`public/` 內的檔案（`index.html`、`manifest.json`、`robots.txt`、`_redirects`、
`_headers`、`icons/`）會原樣複製進 `dist/`。

### 2. 部署到 Cloudflare Workers（建議方式）

託管、DNS 與管理平台的存取保護全部在 Cloudflare：一個 Worker 以靜態資產的方式服務單一
管理網站。`wrangler.toml` 指定 Worker 名稱、資產目錄（`dist/`）與 SPA fallback；
`/` → `/admin` 轉址、快取與整站 `noindex` 標頭由 `public/_redirects` 與 `public/_headers`
提供（匯出時原樣複製進 `dist/`，Workers 與 Pages 都讀這兩個檔案）。

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
5. **Build variables**（選配）：不設也能建置成功並正常上線，AI 審核會改用裝置端規則。
   要用伺服器端 AI 審核時，到 Worker → Settings → **Build** → Variables and Secrets 設定：
   - `EXPO_PUBLIC_BILT_URL` = `https://<project-id>.cloud.bilt.me`
   - `EXPO_PUBLIC_BILT_ANON_KEY` = `<anon-key>`
   - 這兩個值是**建置時**寫進 bundle 的，必須設在 Build 區塊（不是執行時的 Worker
     變數），改完要重新觸發一次建置才會生效。
   - Node 版本由 repo 根目錄的 `.node-version`（`20.19.4`）決定，不必再設
     `NODE_VERSION`；若要臨時換版，設 `NODE_VERSION` 會覆寫該檔案。
6. **Create and deploy**，等第一次建置跑完（Building → Deploying → Success）。
   完成後先用 `https://instantgig.<子網域>.workers.dev` 開啟確認會進到管理員登入頁。
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
- `EXPO_PUBLIC_*` 設在執行時變數而不是 Build 變數，建置時讀不到（該環境的 AI 審核會退回裝置端規則）。
- `package-lock.json` 沒跟著 commit，`npm ci` 直接失敗。
- `workers.dev` 網址與每個預覽版本網址都是公開的管理入口（只剩帳密保護），
  上線前務必照第 7 節一起用 Access 鎖住，或直接關閉 `workers.dev` 路由。

**方式 B：本機用 Wrangler 直接部署**

本機部署不會讀儀表板的建置變數，`EXPO_PUBLIC_*` 必須在自己的 shell 匯出。

```sh
export EXPO_PUBLIC_BILT_URL="https://<project-id>.cloud.bilt.me"
export EXPO_PUBLIC_BILT_ANON_KEY="<anon-key>"

npx wrangler login
npm run deploy:web          # 建置後部署為線上版本
npm run deploy:web:preview  # 建置後只上傳預覽版本，不接線上流量
```

`wrangler.toml` 已指定資產目錄，指令不要再附加 `dist` 或 `--assets` 參數。

**若你想改用 Cloudflare Pages**

Pages 仍可用，但要把 `wrangler.toml` 的 `[assets]` 區塊換回
`pages_build_output_dir = "dist"`，`package.json` 的 deploy 指令換回
`wrangler pages deploy --branch=main`，並在儀表板選 Pages → Connect to Git
（Framework preset `None`、Build command `npm run build:web`、Build output directory `dist`）。
兩者不能共存於同一份 `wrangler.toml`。

### 3. 綁定網域與 DNS（選配，先用 workers.dev 也可以）

前置條件：`instantgig.tw` 的 DNS 已由 Cloudflare 託管（尚未轉移請先做第 6 節）。

這個網站是管理後台，因此只需要一個網域。在 Worker → Settings → **Domains & Routes** →
Add → **Custom domain** 加入 `admin.instantgig.tw`；網域的 zone 在同一個 Cloudflare 帳號時，
DNS 記錄會自動建立：

| 網域                  | 記錄類型 | 名稱／Host | 值                     | 用途           |
| --------------------- | -------- | ---------- | ---------------------- | -------------- |
| `admin.instantgig.tw` | CNAME    | `admin`    | 由 Cloudflare 自動填入 | 管理員專屬平台 |

注意事項：

- **不要**把 `instantgig.tw` 或 `www` 指到這個 Worker，否則主網域會變成管理後台入口。
  apex 與 `www` 留給未來的行銷頁或直接不設。
- 這筆記錄必須是 **Proxied（橘雲）**。Workers 自訂網域一律經過 Cloudflare 代理，
  這也是 Access 能保護它的原因。
- 憑證由 Cloudflare 自動簽發，Domains & Routes 顯示 **Active** 即完成。
- 綁好自訂網域後，建議到同一頁把 `workers.dev` 路由關閉（Disable），
  避免多一個沒被 Access 保護的公開入口。

### 4. 網頁版的路由行為

`lib/adminHost.ts` 的 `IS_ADMIN_WEB` 在網頁版恆為 `true`，`components/WebAdminGate.tsx`
依此收斂路由：

- 網頁上開任何路徑（含 `/`）都會導到 `/admin`，未登入則停在 `/admin/login`；
  一般使用者介面在網頁上完全不可達，分頁標題固定顯示「即時發管理平台」。
- 管理主控台與登入頁不顯示「返回一般使用者介面」，因為網頁沒有那一側。
- 原生 App 相反：`app/admin/_layout.tsx` 在非 web 平台一律 `Redirect` 到 `/(tabs)`，
  手機上沒有任何管理入口。
- 本機驗證：`npx expo start --web` 開啟後應該直接看到管理員登入頁；
  要驗一般使用者介面請用 Expo Go 或模擬器。

### 5. 其他主機（備用設定）

| 平台       | 設定檔              | 說明                                                                  |
| ---------- | ------------------- | --------------------------------------------------------------------- |
| 自架 Nginx | `deploy/nginx.conf` | 複製 `dist/` 到 `/var/www/instantgig/`，調整 `server_name` 與憑證路徑 |

`public/_redirects` 與 `public/_headers` 是 Cloudflare 格式（Workers 靜態資產與 Pages 都讀
同一份，Netlify 也相容），換主機時只要確認該主機支援這兩個檔案，或改用該主機自己的設定方式。

因為是單頁輸出，任何主機都必須把未命中檔案的路徑改寫回 `index.html`，
否則直接開 `/admin/login` 會 404。Cloudflare 這邊是靠 `wrangler.toml` 的
`assets.not_found_handling = "single-page-application"`（不是 `_redirects` 的 catch-all —
Cloudflare 的轉址規則就算命中真實檔案也會執行，catch-all 會蓋掉 `/_expo/` 的 JS bundle）。

### 6. 把 `instantgig.tw` 的 DNS 轉到 Cloudflare（只有要用自訂網域或 Access 時才需要）

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

1. 註冊／登入 Cloudflare → Add a site → 輸入 `instantgig.tw`。
2. 方案選 **Free**。
3. Cloudflare 會自動掃描現有記錄。掃描不保證完整，**逐筆比對步驟 0 的清單**，缺的手動補上。
4. 網站上線用的記錄不用手動建：轉移完成後在 Pages 專案加自訂網域（第 3 節），
   Cloudflare 會自動寫入 `admin` 的 CNAME。
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
dig NS instantgig.tw +short

# 管理網域是否解得到
dig admin.instantgig.tw +short

# 郵件記錄有沒有漏
dig MX instantgig.tw +short
dig TXT instantgig.tw +short
```

再用瀏覽器實測 `https://admin.instantgig.tw` 正常，Worker 的 Domains & Routes 顯示
**Active**。**寄一封測試信到你的網域信箱**確認郵件沒斷。

**步驟 5：設定 SSL 與開始接 Access**

1. Cloudflare → SSL/TLS → Overview → 選 **Full (strict)**（不要用 Flexible，會造成無限轉址）。
2. `admin` 保持 **Proxied（橘雲）**，這是 Workers 自訂網域的正常狀態。
3. 接著照第 7 節在 `admin.instantgig.tw` 上設定 Cloudflare Access。

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

### 7. 用 Cloudflare Access 保護管理網站（選配，免費）

管理網站用 Cloudflare Zero Trust 的 **Access** 在邊緣擋下未授權請求：免費方案含 50 位
使用者，未通過驗證的人連 HTML 與 JS 都拿不到。因為託管已在 Cloudflare，
自訂網域本來就是 Proxied，不需要額外調整 DNS。網頁版整站都是管理後台，
所以這道保護要套在整個網站上。

前置條件：`instantgig.tw` 的 DNS 由 Cloudflare 託管（見第 6 節），且 `admin` 已在 Worker
的 Domains & Routes 顯示 Active。

1. **開通 Zero Trust**：Cloudflare 儀表板 → Zero Trust → 選 Free 方案（需綁信用卡但
   50 位使用者內不收費）→ 設定 team 名稱（會產生 `<team>.cloudflareaccess.com`）。
2. **設定登入方式**：Zero Trust → Settings → Authentication → Login methods，確認
   **One-time PIN**（Email 驗證碼）已啟用。要用 Google 帳號登入就再新增 Google
   identity provider。
3. **新增 Access 應用程式**：Zero Trust → Access → Applications → Add an application →
   **Self-hosted**
   - Application name：`InstantGig Admin`
   - Session Duration：`24 hours`（可依需求縮短）
   - Public hostname：Subdomain `admin`、Domain `instantgig.tw`、Path 留空
4. **新增 Allow 政策**：
   - Policy name：`Admin allowlist`、Action：`Allow`
   - Include → Selector `Emails`，填入允許進入的信箱（多筆逐一新增）；
     想放行整個公司網域可改用 `Emails ending in` → `@instantgig.tw`
   - 存檔後不要再加任何 Bypass 政策，否則等於沒鎖。
5. **檢查 admin 記錄是 Proxied**：DNS → `admin` 的 CNAME 應該已是**橘雲（Proxied）**
   （Workers 自訂網域的預設狀態）。Access 只能保護經過 Cloudflare 代理的主機名稱。
6. **設定 SSL 模式**：SSL/TLS → Overview → 選 **Full (strict)**。
7. **一併處理 `workers.dev` 與預覽網址**：Worker 的 `instantgig.<子網域>.workers.dev`
   與每個預覽版本網址也能開到 `/admin`，只剩帳密保護。兩種做法：
   - 最乾脆：Worker → Settings → Domains & Routes → 把 `workers.dev` 路由 **Disable**，
     並關閉 Preview URLs。
   - 想留著用：在 Zero Trust 再建一個 Self-hosted 應用程式，hostname 設為
     `instantgig.<子網域>.workers.dev`（預覽網址用 `*.workers.dev` 通用比對），
     套用同一條 Allow 政策。
8. **驗證**：用無痕視窗開 `https://admin.instantgig.tw` → 出現 Cloudflare 驗證碼畫面 →
   收信輸入 6 位碼 → 才會看到管理員登入頁，接著仍需輸入管理員帳密（雙層驗證）。

應用內對應行為（已實作）：

- `hooks/useAccessIdentity.ts` 會讀取 Cloudflare 的 `/cdn-cgi/access/get-identity`，
  在管理主控台與登入頁顯示「Cloudflare Access 已驗證」與該信箱；沒有 Access 保護時
  自動隱藏，不影響本機或 `workers.dev` 直連的行為。
- 管理主控台的登出改為兩個選項：僅登出管理帳號，或連同 Cloudflare 連線一起結束
  （導向 `/cdn-cgi/access/logout`，下次進入要重新驗證）。
- `/cdn-cgi/` 由 Cloudflare 邊緣處理，不會進到靜態資產的 SPA fallback，也不受
  `public/_redirects` 影響。

需要自動化（監控、E2E 測試）通過 Access 時，用 Zero Trust → Access → Service Auth 建立
Service Token，並在該應用程式加一條 `Service Auth` 政策，請求帶
`CF-Access-Client-Id` / `CF-Access-Client-Secret` 標頭即可。

### 8. 搜尋引擎與存取

- 網頁版整站都是管理後台，因此**整站 noindex**：`public/robots.txt` 是 `Disallow: /`，
  `public/_headers` 讓 `/*` 的回應帶 `X-Robots-Tag: noindex, nofollow`，
  `public/index.html` 另有 `<meta name="robots" content="noindex, nofollow">`。
  不需要再設 Cloudflare 的 Transform Rules。
- 進入 `/admin` 時前端還會插入一次 `<meta name="robots">`，涵蓋只讀執行後 DOM 的爬蟲。
- 存取有兩道關卡：Cloudflare Access（網域層，見第 7 節）與管理員帳密
  （`lib/stores/adminAuth.ts`，連續 5 次失敗鎖定 60 秒）。未設定 Access 時網域本身是
  公開的，只剩帳密保護。

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
