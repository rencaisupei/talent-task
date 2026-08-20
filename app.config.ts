import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [
          ['expo-dev-client', { launchMode: 'most-recent' }],
          'react-native-maps',
          [
            'expo-notifications',
            {
              color: '#1F6FB2',
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
    userInterfaceStyle: 'automatic',
    scheme: 'app',
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
      supportsTablet: true,
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
