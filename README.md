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
- 若 DNS 託管在 Cloudflare，這三筆記錄要設為 **DNS only**（灰雲），避免雙層 CDN 造成
  憑證與快取問題。
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

### 6. 管理平台的搜尋引擎與存取

- `public/robots.txt` 禁止收錄 `/admin`、`/admin-dashboard`。
- `admin.instantgig.tw` 的 `/robots.txt` 會被改寫成 `public/admin-robots.txt`
  （整站 `Disallow: /`），且該網域所有回應都帶 `X-Robots-Tag: noindex, nofollow`。
- 進入 `/admin` 時前端另會插入 `<meta name="robots" content="noindex, nofollow">`。
- 存取仍需管理員帳密（`lib/stores/adminAuth.ts`），連續 5 次失敗鎖定 60 秒。
  網域本身是公開的，若要更嚴格，可在 Vercel 專案加上 Deployment Protection
  或於 `admin.instantgig.tw` 前面自行加 IP 白名單。

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
