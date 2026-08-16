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
              color: '#00A896',
            },
          ],
        ]
      : [];

  // Brand mark shown as the launcher icon and on the native launch screen.
  const brandMark = './assets/instantgig-mark.png';

  return {
    ...config,
    name: '即時發',
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
      },
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'com.yourcompany.yourapp',
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'com.yourcompany.yourapp',
      adaptiveIcon: {
        // Padded version of the mark: Android crops the foreground to a mask,
        // so the full-bleed brandMark would lose the paper-plane tip.
        foregroundImage: './public/icons/instantgig-maskable.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      bundler: 'metro',
      // 'single' = SPA export: one index.html + client routing, so edge serving
      // needs only a single 404→index.html fallback rule.
      output: 'single',
      favicon: './public/icons/instantgig-icon.png',
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
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
