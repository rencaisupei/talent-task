// 把 Google Maps 的 Android 金鑰寫進 AndroidManifest 的 meta-data。
//
// 為什麼要自己寫這支外掛：
// 1. react-native-maps 沒有附 Expo config plugin（套件裡沒有 app.plugin.js），
//    在 plugins 陣列寫 'react-native-maps' 會讓 `expo prebuild` 解析外掛時失敗。
// 2. SDK 54 的 @expo/prebuild-config 不再自動處理 app 設定裡的
//    `android.config.googleMaps.apiKey`（整份 node_modules 都沒有任何程式碼寫入
//    `com.google.android.geo.API_KEY`），那個欄位現在只是型別上還留著。
//
// 少了這段 meta-data，Android 的地圖只會顯示灰底，而且不會拋出任何錯誤。
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const META_DATA_NAME = 'com.google.android.geo.API_KEY';

/**
 * @param {import('expo/config').ExpoConfig} config
 * @param {{ apiKey?: string }} [props]
 */
module.exports = function withAndroidGoogleMaps(config, props) {
  const apiKey = props?.apiKey || config.android?.config?.googleMaps?.apiKey;

  // 沒給金鑰就什麼都不做：App 其他功能照常，只有地圖模式是灰底。
  if (!apiKey) return config;

  return withAndroidManifest(config, (androidConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      androidConfig.modResults,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_NAME,
      apiKey,
    );
    return androidConfig;
  });
};
