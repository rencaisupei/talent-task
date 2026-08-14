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
