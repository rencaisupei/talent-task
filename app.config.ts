import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

/** 上架用的品牌／法務資訊，App 內的「關於」與頁尾會讀同一份。 */
const COMPANY = {
  name: '創極數位資訊企業社',
  product: '極速心動JiMatch',
  supportEmail: 'support@jimatch.app',
  /** Universal Link / App Link 網域，換成自己的網域後需重新建置。 */
  linkDomain: 'jimatch.app',
  copyright: '© 2026 創極數位資訊-極速心動JiMatch',
} as const;

const PERMISSION_COPY = {
  camera: 'JiMatch 需要相機權限，才能拍照上傳個人照片、完成真人認證與進行視訊通話。',
  photos: 'JiMatch 需要讀取相簿，才能讓你挑選個人照片與在聊天、動態中分享照片。',
  photosAdd: 'JiMatch 需要儲存權限，才能把聊天或動態中的照片存到你的相簿。',
  microphone: 'JiMatch 需要麥克風權限，才能傳送語音訊息以及進行語音／視訊通話。',
  location: 'JiMatch 需要位置權限，才能顯示附近的人與距離，幫你找到同城的對象。',
  contacts: 'JiMatch 需要通訊錄權限，才能協助你隱藏認識的人或邀請朋友一起玩遊戲。',
  faceId: 'JiMatch 使用 Face ID 保護你的帳號與付款設定。',
  tracking: '允許追蹤可讓 JiMatch 提供更貼近你興趣的配對與活動推薦，我們不會販售你的個人資料。',
} as const;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }]]
      : [];

  return {
    ...config,
    name: 'JiMatch',
    slug: 'jimatch',
    description:
      'JiMatch 極速心動：用互動遊戲認識新朋友。極速開局、大富翁與多人派對房，邊玩邊配對。',
    primaryColor: '#FF4F9A',
    newArchEnabled: true,
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    backgroundColor: '#121212',
    icon: './assets/images/icon.png',
    scheme: 'jimatch',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'me.bilt.jimatch',
      buildNumber: '1',
      icon: './assets/images/icon.png',
      appStoreUrl: process.env.BILT_APP_STORE_APP_ID
        ? `https://apps.apple.com/app/id${process.env.BILT_APP_STORE_APP_ID}`
        : undefined,
      // Universal Links：把 apple-app-site-association 放到自己的網域後才會生效。
      associatedDomains: [`applinks:${COMPANY.linkDomain}`],
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleAllowMixedLocalizations: true,
        CFBundleLocalizations: ['zh-Hant', 'en'],
        CFBundleDisplayName: 'JiMatch',
        UIBackgroundModes: ['audio', 'remote-notification'],
        UIViewControllerBasedStatusBarAppearance: false,
        LSApplicationQueriesSchemes: ['tel', 'sms', 'mailto', 'https'],
        NSCameraUsageDescription: PERMISSION_COPY.camera,
        NSPhotoLibraryUsageDescription: PERMISSION_COPY.photos,
        NSPhotoLibraryAddUsageDescription: PERMISSION_COPY.photosAdd,
        NSMicrophoneUsageDescription: PERMISSION_COPY.microphone,
        NSLocationWhenInUseUsageDescription: PERMISSION_COPY.location,
        NSContactsUsageDescription: PERMISSION_COPY.contacts,
        NSFaceIDUsageDescription: PERMISSION_COPY.faceId,
        NSUserTrackingUsageDescription: PERMISSION_COPY.tracking,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
        },
      },
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
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'me.bilt.jimatch',
      versionCode: 1,
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: 'resize',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        monochromeImage: './assets/images/notification-icon.png',
        backgroundColor: '#121212',
      },
      permissions: [
        'android.permission.INTERNET',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.READ_CONTACTS',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
        'com.android.vending.BILLING',
      ],
      blockedPermissions: [
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: COMPANY.linkDomain,
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'jimatch' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      // 'single' = SPA export: one index.html + client routing, so edge serving
      // needs only a single 404→index.html fallback rule.
      output: 'single',
      favicon: './public/icons/icon-192.png',
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
      company: COMPANY,
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/images/adaptive-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#121212',
          dark: {
            image: './assets/images/adaptive-icon.png',
            backgroundColor: '#121212',
          },
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: PERMISSION_COPY.camera,
          microphonePermission: PERMISSION_COPY.microphone,
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: PERMISSION_COPY.photos,
          cameraPermission: PERMISSION_COPY.camera,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: PERMISSION_COPY.location,
          isAndroidBackgroundLocationEnabled: false,
          isIosBackgroundLocationEnabled: false,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#FF4F9A',
          defaultChannel: 'default',
          enableBackgroundRemoteNotifications: false,
        },
      ],
      [
        'expo-audio',
        {
          microphonePermission: PERMISSION_COPY.microphone,
        },
      ],
      [
        'expo-contacts',
        {
          contactsPermission: PERMISSION_COPY.contacts,
        },
      ],
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission: PERMISSION_COPY.tracking,
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
          },
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
          },
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
