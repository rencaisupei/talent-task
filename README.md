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

`public/` 內的檔案（`index.html`、`manifest.json`、`robots.txt`、`_redirects`、
`_headers`、`icons/`）會原樣複製進 `dist/`。

### 2. 部署（`dist/` 是唯一要上傳的目錄）

因為是單頁輸出，主機必須把所有未命中檔案的路徑改寫回 `index.html`，
否則直接開 `/admin/login` 會 404。各平台設定已附在專案內：

| 平台             | 設定檔                                                   | 說明                                                                  |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Vercel           | `vercel.json`                                            | 匯入 repo 即可，已含 build 指令、輸出目錄、改寫與快取標頭             |
| Netlify          | `netlify.toml` + `public/_redirects` + `public/_headers` | 連結 repo 或 `npx netlify deploy --prod --dir dist`                   |
| Cloudflare Pages | `public/_redirects` + `public/_headers`                  | Build 指令 `npm run build:web`，輸出目錄 `dist`                       |
| 自架 Nginx       | `deploy/nginx.conf`                                      | 複製 `dist/` 到 `/var/www/instantgig/`，調整 `server_name` 與憑證路徑 |

在平台後台把 `EXPO_PUBLIC_BILT_URL` 與 `EXPO_PUBLIC_BILT_ANON_KEY` 設為建置環境變數。

### 3. 管理平台的搜尋引擎與存取

- `public/robots.txt` 禁止收錄 `/admin`、`/admin-dashboard`。
- 主機端對 `/admin*` 回 `X-Robots-Tag: noindex, nofollow`（見各平台設定檔）。
- 進入 `/admin` 時前端會插入 `<meta name="robots" content="noindex, nofollow">`。
- 存取仍需管理員帳密（`lib/stores/adminAuth.ts`），連續 5 次失敗鎖定 60 秒。
- 想讓管理平台獨立於公開網站，可把同一份 `dist/` 部署到 `admin.instantgig.tw`
  子網域（DNS 指向該平台後，`deploy/nginx.conf` 的 `server_name` 已是此網域）。

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
