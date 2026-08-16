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

管理員專屬平台只在網頁版提供（`app/admin/`），手機 App 不顯示任何入口。網頁版就是這個
Expo 專案以 `web.output: 'single'`（SPA）匯出的靜態網站。

### 1. 本機匯出

```sh
npm ci

# 後端連線資訊會在建置時被寫進 bundle，缺少時 AI 認證與資料存取會失效
export EXPO_PUBLIC_BILT_URL="https://<project-id>.cloud.bilt.me"
export EXPO_PUBLIC_BILT_ANON_KEY="<anon-key>"

npm run build:web       # 輸出到 dist/
npm run serve:web       # 以 SPA 模式在 http://localhost:4173 預覽
```

`npm run build:pwa` 會在匯出後額外產生 `dist/sw.js`（Workbox 離線快取），
需要可安裝的 PWA 時再用。

`public/` 內的檔案（`index.html`、`manifest.json`、`robots.txt`、`admin-robots.txt`、
`_redirects`、`_headers`、`icons/`）會原樣複製進 `dist/`。

### 2. 部署到 Vercel（建議方式）

一個 Vercel 專案同時服務兩個網域：`instantgig.tw` 是一般使用者網站，
`admin.instantgig.tw` 只提供管理平台。`vercel.json` 已含建置指令、輸出目錄、
SPA 改寫、快取與 `noindex` 標頭，匯入後不需再調整。

1. 在 [vercel.com/new](https://vercel.com/new) 匯入這個 repo。Framework Preset 選
   **Other**；Build Command 與 Output Directory 會由 `vercel.json` 帶入
   （`npm run build:web` → `dist`）。
2. Settings → Environment Variables 新增（Production 與 Preview 都要）：
   - `EXPO_PUBLIC_BILT_URL` = `https://<project-id>.cloud.bilt.me`
   - `EXPO_PUBLIC_BILT_ANON_KEY` = `<anon-key>`
   - 選填：`EXPO_PUBLIC_ADMIN_HOST`（管理網域，預設 `admin.instantgig.tw`，
     多個以逗號分隔）
3. Deploy。之後每次 push 到主分支就會自動重新部署；本機臨時部署可用
   `npm run deploy:web`（正式）或 `npm run deploy:web:preview`（預覽）。

### 3. 綁定網域與 DNS

Settings → Domains 依序加入三個網域，Vercel 會顯示各自要填的 DNS 值（照畫面顯示的填，
下表是常見值）：

| 網域                  | 記錄類型 | 名稱／Host | 值                                       | 用途                     |
| --------------------- | -------- | ---------- | ---------------------------------------- | ------------------------ |
| `instantgig.tw`       | A        | `@`        | Vercel 在 Domains 畫面顯示的 IP          | 一般使用者網站（主網域） |
| `www.instantgig.tw`   | CNAME    | `www`      | 專案專屬值，如 `xxxx.vercel-dns-017.com` | 轉址到主網域             |
| `admin.instantgig.tw` | CNAME    | `admin`    | 與 `www` 相同的專案專屬值                | 管理員專屬平台           |

注意事項：

- 子網域一定用 CNAME，apex（`instantgig.tw`）只能用 A 記錄，不要對 apex 設 CNAME。
- DNS 託管在 Cloudflare 時，先把三筆記錄都設為 **DNS only**（灰雲），等 Vercel 的
  Domains 頁面顯示 Valid Configuration、憑證簽發完成再往下做。
- 之後若要用 Cloudflare Access 保護管理平台（見第 6 節），只把 `admin` 這一筆改為
  **Proxied**（橘雲）；`instantgig.tw` 與 `www` 保持 DNS only，避免主站走雙層 CDN。
- DNS 生效後 Vercel 會自動簽發憑證，Domains 頁面顯示 Valid Configuration 即完成。

### 4. 管理網域的行為

`lib/adminHost.ts` 會在載入時判斷主機名稱，`components/AdminHostGate.tsx` 依此收斂路由：

- 在 `admin.instantgig.tw` 開任何路徑（含 `/`）都會導到 `/admin`，未登入則停在
  `/admin/login`；一般使用者介面在這個網域完全不可達，分頁標題顯示「即時發管理平台」。
- 管理主控台與登入頁在此網域不顯示「返回一般使用者介面」，因為沒有可返回的目標。
- 在 `instantgig.tw` 行為不變：一般使用者網站照常運作，仍可用 `/admin/login`
  或帳戶頁長按「帳戶」標題進入管理平台。
- 本機驗證：用 `http://admin.localhost:8081` 開啟 dev server 即可測到同一套行為
  （任何 `admin.` 開頭的主機都算管理網域）。

### 5. 其他主機（備用設定）

| 平台             | 設定檔                                                   | 說明                                                                  |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Netlify          | `netlify.toml` + `public/_redirects` + `public/_headers` | 連結 repo 或 `npx netlify deploy --prod --dir dist`                   |
| Cloudflare Pages | `public/_redirects` + `public/_headers`                  | Build 指令 `npm run build:web`，輸出目錄 `dist`                       |
| 自架 Nginx       | `deploy/nginx.conf`                                      | 複製 `dist/` 到 `/var/www/instantgig/`，調整 `server_name` 與憑證路徑 |

因為是單頁輸出，任何主機都必須把未命中檔案的路徑改寫回 `index.html`，
否則直接開 `/admin/login` 會 404。

### 6. 用 Cloudflare Access 保護 `admin.instantgig.tw`（免費）

Vercel 的 Deployment Protection 是**專案層級**設定，無法只鎖單一網域，而且要保護正式
網域必須加購 Advanced Deployment Protection（Pro 方案每月 US$150）。因此管理網域改用
Cloudflare Zero Trust 的 **Access** 在 Cloudflare 邊緣擋下未授權請求：免費方案含 50 位
使用者，主網域完全不受影響，未通過驗證的人連 HTML 與 JS 都拿不到。

前置條件：`instantgig.tw` 的 DNS 由 Cloudflare 託管（Nameserver 指向 Cloudflare）。

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
5. **把 admin 記錄改成 Proxied**：DNS → 找到 `admin` 的 CNAME → 把灰雲點成
   **橘雲（Proxied）**。Access 只能保護經過 Cloudflare 代理的主機名稱。
6. **設定 SSL 模式**：SSL/TLS → Overview → 選 **Full (strict)**。若切換後出現 526／525
   錯誤，多半是憑證還沒簽好：先把 `admin` 改回 DNS only，等 Vercel Domains 顯示
   Valid Configuration 再改回 Proxied。
7. **驗證**：用無痕視窗開 `https://admin.instantgig.tw` → 出現 Cloudflare 驗證碼畫面 →
   收信輸入 6 位碼 → 才會看到管理員登入頁，接著仍需輸入管理員帳密（雙層驗證）。
   另外開 `https://instantgig.tw` 確認主站沒有被擋。

應用內對應行為（已實作）：

- `hooks/useAccessIdentity.ts` 會讀取 Cloudflare 的 `/cdn-cgi/access/get-identity`，
  在管理主控台與登入頁顯示「Cloudflare Access 已驗證」與該信箱；沒有 Access 保護時
  自動隱藏，不影響本機或 Vercel 直連的行為。
- 管理主控台的登出改為兩個選項：僅登出管理帳號，或連同 Cloudflare 連線一起結束
  （導向 `/cdn-cgi/access/logout`，下次進入要重新驗證）。
- `vercel.json` 的 SPA 改寫已排除 `/cdn-cgi/`，避免這些端點被改寫成 `index.html`。

需要自動化（監控、E2E 測試）通過 Access 時，用 Zero Trust → Access → Service Auth 建立
Service Token，並在該應用程式加一條 `Service Auth` 政策，請求帶
`CF-Access-Client-Id` / `CF-Access-Client-Secret` 標頭即可。

### 7. 管理平台的搜尋引擎與存取

- `public/robots.txt` 禁止收錄 `/admin`、`/admin-dashboard`。
- `admin.instantgig.tw` 的 `/robots.txt` 會被改寫成 `public/admin-robots.txt`
  （整站 `Disallow: /`），且該網域所有回應都帶 `X-Robots-Tag: noindex, nofollow`。
- 進入 `/admin` 時前端另會插入 `<meta name="robots" content="noindex, nofollow">`。
- 存取有兩道關卡：Cloudflare Access（網域層，見第 6 節）與管理員帳密
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
