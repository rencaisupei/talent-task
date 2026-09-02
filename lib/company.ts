import Constants from 'expo-constants';

/** 公司／產品識別資訊，來源是 app.config.ts 的 extra.company。 */
export interface CompanyInfo {
  name: string;
  product: string;
  supportEmail: string;
  linkDomain: string;
  copyright: string;
}

const FALLBACK: CompanyInfo = {
  name: '創極數位資訊企業社',
  product: '極速心動JiMatch',
  supportEmail: 'support@jimatch.app',
  linkDomain: 'jimatch.app',
  copyright: '© 2026 創極數位資訊-極速心動JiMatch',
};

const extra = Constants.expoConfig?.extra as { company?: Partial<CompanyInfo> } | undefined;

export const COMPANY: CompanyInfo = { ...FALLBACK, ...extra?.company };

/** 全站頁尾使用的版權字串。 */
export const COPYRIGHT = COMPANY.copyright;

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
