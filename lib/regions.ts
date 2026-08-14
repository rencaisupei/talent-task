/** 全台地區清單（22 縣市），用於任務地點下拉選單與人才服務範圍。 */

export const TAIWAN_REGIONS = [
  '基隆市',
  '臺北市',
  '新北市',
  '桃園市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '臺中市',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '臺南市',
  '高雄市',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
] as const;

export type TaiwanRegion = (typeof TAIWAN_REGIONS)[number];

export const REGION_ANY = '全台不限';

export const REGION_OPTIONS: string[] = [REGION_ANY, ...TAIWAN_REGIONS];

export interface RegionCoordinate {
  latitude: number;
  longitude: number;
}

/** 全台 22 縣市代表座標（縣市中心點），用於地圖模式標記。 */
export const REGION_COORDS: Record<string, RegionCoordinate> = {
  基隆市: { latitude: 25.1276, longitude: 121.7392 },
  臺北市: { latitude: 25.033, longitude: 121.5654 },
  新北市: { latitude: 25.0169, longitude: 121.4628 },
  桃園市: { latitude: 24.9937, longitude: 121.2969 },
  新竹市: { latitude: 24.8039, longitude: 120.9647 },
  新竹縣: { latitude: 24.8387, longitude: 121.0177 },
  苗栗縣: { latitude: 24.5602, longitude: 120.8214 },
  臺中市: { latitude: 24.1477, longitude: 120.6736 },
  彰化縣: { latitude: 24.0518, longitude: 120.5161 },
  南投縣: { latitude: 23.9609, longitude: 120.9718 },
  雲林縣: { latitude: 23.7092, longitude: 120.4313 },
  嘉義市: { latitude: 23.4801, longitude: 120.4491 },
  嘉義縣: { latitude: 23.4518, longitude: 120.2555 },
  臺南市: { latitude: 22.9999, longitude: 120.227 },
  高雄市: { latitude: 22.6273, longitude: 120.3014 },
  屏東縣: { latitude: 22.552, longitude: 120.5487 },
  宜蘭縣: { latitude: 24.7021, longitude: 121.7378 },
  花蓮縣: { latitude: 23.9871, longitude: 121.6015 },
  臺東縣: { latitude: 22.7583, longitude: 121.1444 },
  澎湖縣: { latitude: 23.5712, longitude: 119.5793 },
  金門縣: { latitude: 24.4321, longitude: 118.3171 },
  連江縣: { latitude: 26.1608, longitude: 119.9489 },
};

/** 全台視野中心點與跨度（地圖模式預設視角）。 */
export const TAIWAN_VIEWPORT = {
  latitude: 23.8,
  longitude: 120.95,
  latitudeDelta: 3.8,
  longitudeDelta: 3.4,
};

export function regionCoordinate(region: string): RegionCoordinate {
  return (
    REGION_COORDS[region] ?? {
      latitude: TAIWAN_VIEWPORT.latitude,
      longitude: TAIWAN_VIEWPORT.longitude,
    }
  );
}
