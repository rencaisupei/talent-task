import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  // Bilt 的原生建置會設 EXPO_PLATFORM=native；本機直接跑 `expo prebuild` 或
  // `expo run:android` 時沒有這個變數，少了指令判斷就會產出一個沒有權限說明、
  // 沒有通知圖示、也沒有地圖金鑰的原生專案 —— 而且完全不會報錯。
  const isNativeBuild =
    process.env.EXPO_PLATFORM === 'native' ||
    process.argv.some((arg) => arg === 'prebuild' || arg.startsWith('run:'));

  const nativePlugins: ExpoPlugins = isNativeBuild
    ? [
        ['expo-dev-client', { launchMode: 'most-recent' }],
        // react-native-maps 沒有附 config plugin（套件裡沒有 app.plugin.js），
        // 在這裡寫 'react-native-maps' 會讓 expo prebuild 解析外掛時直接失敗。
        // Android 需要的金鑰 meta-data 由自備的外掛寫入（SDK 54 的 prebuild
        // 不再自動處理 android.config.googleMaps.apiKey）。
        ['./plugins/withAndroidGoogleMaps', { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
        [
          'expo-notifications',
          {
            // 96x96 純白剪影＋透明背景：Android 只取 alpha 通道，彩色圖會被畫成白方塊。
            icon: './public/icons/talentmatch-notification.png',
            color: '#1F6FB2',
            // 與 lib/push.ts 的 ensureAndroidChannel() 建立的通道同名。
            defaultChannel: 'default',
          },
        ],
        [
          'expo-location',
          {
            // 只有「發布任務時偵測所在地區」會用到定位，因此只宣告使用中權限；
            // 背景定位與動作感測都關閉，商店審核不會要求額外說明。
            locationWhenInUsePermission:
              '人才速配需要你的位置，才能把急件標到正確的地區並依距離排序附近的任務。',
            locationAlwaysAndWhenInUsePermission: false,
            locationAlwaysPermission: false,
            motionUsagePermission: false,
            isIosBackgroundLocationEnabled: false,
            isAndroidBackgroundLocationEnabled: false,
            isAndroidForegroundServiceEnabled: false,
            isAndroidMotionActivityEnabled: false,
          },
        ],
        [
          'expo-image-picker',
          {
            // 只用相簿選取證照／作品照片，沒有拍照與錄音功能，
            // 所以相機與麥克風的說明都設 false（不寫入 Info.plist、不加 RECORD_AUDIO）。
            photosPermission:
              '人才速配需要讀取相簿，才能讓你上傳專業證照或作品照片供平台認證審核。',
            cameraPermission: false,
            microphonePermission: false,
          },
        ],
      ]
    : [];

  // Brand mark shown as the launcher icon and on the native launch screen.
  // Kept in public/icons alongside the web icons so every surface (native icon,
  // adaptive icon, favicon, PWA manifest, in-app BrandLogo) uses one source file.
  const brandMark = './public/icons/talentmatch-icon.png';

  return {
    ...config,
    name: '人才速配',
    slug: 'app',
    newArchEnabled: true,
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    icon: brandMark,
    // 介面鎖定淺色（app/_layout.tsx 的 Uniwind.setTheme('light')）。這裡若留
    // 'automatic'，系統在深色模式下會把原生元件（鍵盤、系統對話、原生 modal
    // 背景、分享面板）畫成深色，和淺色版面混在一起。
    userInterfaceStyle: 'light',
    // 'talentmatch' 是對外的深層連結（推播與郵件回到 App 用）；
    // 'app' 保留給既有的開發建置，移除會讓舊的 app:// 連結失效。
    scheme: ['talentmatch', 'app'],
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // 介面只有台灣繁體中文：明確宣告語系，系統才不會依裝置語言挑別的語系或顯示英文
        // 的系統對話（權限說明、分享面板標題等）。
        CFBundleDevelopmentRegion: 'zh_TW',
        CFBundleLocalizations: ['zh-Hant-TW'],
      },
      // App Store 自 2024 年起要求宣告「必要理由 API」，缺少這份清單會在上傳後被退件。
      // UserDefaults：AsyncStorage（所有 Zustand persist）。
      // FileTimestamp / DiskSpace / SystemBootTime：expo-updates、expo-image-picker
      // 與 React Native 內部會讀取，理由碼皆為 Apple 文件中「僅供 App 自身使用」那組。
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
        ],
      },
      // iPhone 版單欄設計。supportsTablet: true 會讓送審必須附 iPad 截圖，
      // 且所有畫面在 iPad 的大尺寸與多工分割下都要可用；目前不提供 iPad 版。
      supportsTablet: false,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'com.yourcompany.yourapp',
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'com.yourcompany.yourapp',
      adaptiveIcon: {
        // Padded version of the mark: Android crops the foreground to a mask,
        // so the full-bleed brandMark would lose the arrowhead.
        foregroundImage: './public/icons/talentmatch-maskable.png',
        backgroundColor: '#FFFFFF',
      },
      // 系統在 App 背後透出的底色（旋轉、分割畫面、啟動瞬間）。介面是純白極簡風，
      // 沒有這一行的話深色模式下會先閃一次黑底。
      backgroundColor: '#FFFFFF',
      // 實際會用到的權限。定位＝發布任務時偵測地區；通知＝新訊息與提案動態；
      // 震動＝通知通道的震動樣式。其餘由 config plugin 自動帶入。
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
      ],
      // 相依套件的 manifest 會夾帶這些權限，但 App 沒有拍照、錄音與背景定位功能。
      // 留著會讓商店權限清單出現使用者無法對應的項目，也會拖慢審核。
      blockedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
      ],
      config: {
        // Android 的地圖（react-native-maps）走 Google Maps，沒有金鑰時只會顯示灰底。
        // 建置時提供 GOOGLE_MAPS_ANDROID_API_KEY 即可，iOS 用 Apple Maps 不需要金鑰。
        // 實際寫進 AndroidManifest 的是 plugins/withAndroidGoogleMaps.js：SDK 54 的
        // prebuild 已經不會自己讀這個欄位，只留著當作金鑰的單一來源。
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        },
      },
    },
    web: {
      bundler: 'metro',
      // 'single' = SPA export: one index.html + client routing, so edge serving
      // needs only a single 404→index.html fallback rule.
      output: 'single',
      // 網頁只有台灣繁體中文；public/index.html 的 lang 屬性也硬寫成同一個值。
      lang: 'zh-Hant-TW',
      favicon: './public/icons/talentmatch-icon.png',
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
      // 後端連線資訊也走 manifest，不只靠 Babel 內嵌的 EXPO_PUBLIC_*：Expo Go 與原生
      // 版每次啟動都會重新取得 manifest，所以就算 JS bundle 是在環境變數還沒設好之前
      // 打包（或命中 Metro 的舊轉譯快取），這裡仍然拿得到當下的值。
      // anonKey 是公開金鑰，出現在 manifest 與 bundle 都是預期行為。
      bilt: {
        url: process.env.EXPO_PUBLIC_BILT_URL ?? null,
        anonKey: process.env.EXPO_PUBLIC_BILT_ANON_KEY ?? null,
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: brandMark,
          imageWidth: 180,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
        },
      ],
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
