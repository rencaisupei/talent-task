import { OMNI_INDUSTRY_TAGS } from '@/lib/omniTags';
import { regionCoordinate, TAIWAN_REGIONS } from '@/lib/regions';
import { moderateText } from '@/lib/moderation';
import {
  type AbuseReport,
  type AiReviewResult,
  type AppNotification,
  type Bid,
  type BudgetLevelId,
  type ChatMessage,
  type Gig,
  LOCAL_USER_ID,
  type Review,
  type TalentProfile,
  type VerificationRequest,
  type WeeklyPoint,
} from '@/lib/types';

/** 固定亂數源，確保每次啟動的示範資料一致。 */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 7, 14, 4, 0, 0);

const CLIENT_NAMES = [
  '林雅婷',
  '陳建豪',
  '黃思妤',
  '張家瑋',
  '吳彥霖',
  '劉宜臻',
  '鄭博文',
  '許庭瑄',
  '曾柏勳',
  '謝孟儒',
  '蔡宛庭',
  '洪子晴',
];

const TALENT_NAMES = [
  '王師傅工班',
  '李冠廷',
  '周雅玲',
  '林彥丞',
  '高語彤',
  '賴俊翔',
  '簡佩容',
  '莊立宇',
  '范芷妍',
  '藍冠霖',
  '柯宥辰',
  '潘思穎',
  '田宗翰',
  '殷嘉玲',
];

const BUDGETS: BudgetLevelId[] = ['B1', 'B2', 'B3', 'B4', 'B5'];

const GIG_TITLE_SUFFIX = [
  '急需到場處理',
  '本週內完成',
  '需有實績經驗',
  '可長期合作',
  '今日內回覆',
  '假日可施作',
];

const GENERATED_TALENTS: TalentProfile[] = TALENT_NAMES.map((name, index) => {
  const random = makeRandom(1000 + index * 37);
  const category = OMNI_INDUSTRY_TAGS[(index * 3) % OMNI_INDUSTRY_TAGS.length];
  const secondary = OMNI_INDUSTRY_TAGS[(index * 7 + 5) % OMNI_INDUSTRY_TAGS.length];
  const tags = Array.from(
    new Set([
      category.tags[Math.floor(random() * category.tags.length)],
      category.tags[Math.floor(random() * category.tags.length)],
      secondary.tags[Math.floor(random() * secondary.tags.length)],
    ]),
  );
  return {
    id: `talent_seed_${index + 1}`,
    name,
    region: TAIWAN_REGIONS[(index * 5) % TAIWAN_REGIONS.length],
    tags,
    isPremium: index % 3 === 0,
    verification: index % 4 === 0 ? 'pending' : 'approved',
    completedJobs: 8 + Math.floor(random() * 120),
    rating: Math.round((4.2 + random() * 0.8) * 10) / 10,
    responseMinutes: 4 + Math.floor(random() * 55),
  };
});

/** 新增專業領域（3C、商用設備、車輛、醫療、農園藝、工業）的示範人才。 */
const DOMAIN_SPECIALIST_TALENTS: TalentProfile[] = [
  {
    id: 'talent_seed_15',
    name: '迅捷 3C 快修',
    region: '臺北市',
    tags: ['手機螢幕更換', '手機電池更換', '手機主板檢測維修'],
    isPremium: true,
    verification: 'approved',
    completedJobs: 412,
    rating: 4.9,
    responseMinutes: 6,
  },
  {
    id: 'talent_seed_16',
    name: '郭子睿',
    region: '新竹市',
    tags: ['硬碟資料救援', '筆電維修與螢幕更換', '桌機組裝與硬體升級'],
    isPremium: true,
    verification: 'approved',
    completedJobs: 268,
    rating: 4.8,
    responseMinutes: 14,
  },
  {
    id: 'talent_seed_17',
    name: '詹宇珊',
    region: '臺中市',
    tags: ['收銀 POS 系統維護', '印表機影印機維修', '商用無線網路佈建'],
    isPremium: false,
    verification: 'approved',
    completedJobs: 153,
    rating: 4.7,
    responseMinutes: 21,
  },
  {
    id: 'talent_seed_18',
    name: '邱柏澔汽車工坊',
    region: '臺南市',
    tags: ['汽車引擎故障診斷', '行車電腦診斷解碼', '電動車電池模組檢測'],
    isPremium: true,
    verification: 'approved',
    completedJobs: 331,
    rating: 4.8,
    responseMinutes: 11,
  },
  {
    id: 'talent_seed_19',
    name: '蘇怡安（護理師）',
    region: '新北市',
    tags: ['居家護理換藥', '傷口照護指導', '急救與心肺復甦教學'],
    isPremium: false,
    verification: 'pending',
    completedJobs: 96,
    rating: 4.9,
    responseMinutes: 33,
  },
  {
    id: 'talent_seed_20',
    name: '綠禾園藝工班',
    region: '宜蘭縣',
    tags: ['大樹移除與截枝', '庭園修剪維護', '農機具維修'],
    isPremium: false,
    verification: 'approved',
    completedJobs: 187,
    rating: 4.6,
    responseMinutes: 42,
  },
  {
    id: 'talent_seed_21',
    name: '鄭工焊接工程',
    region: '彰化縣',
    tags: ['專業焊接加工', '產線機械保養', '消防設備檢修'],
    isPremium: false,
    verification: 'approved',
    completedJobs: 224,
    rating: 4.7,
    responseMinutes: 26,
  },
];

export const SEED_TALENTS: TalentProfile[] = [...GENERATED_TALENTS, ...DOMAIN_SPECIALIST_TALENTS];

/** 依縣市中心點加上固定偏移，讓地圖標記不會完全重疊。 */
function scatterCoordinate(region: string, seed: number) {
  const random = makeRandom(90_000 + seed * 17);
  const base = regionCoordinate(region);
  return {
    latitude: base.latitude + (random() - 0.5) * 0.08,
    longitude: base.longitude + (random() - 0.5) * 0.08,
  };
}

const BROADCAST_GIGS: Gig[] = Array.from({ length: 26 }, (_, index) => {
  const random = makeRandom(500 + index * 91);
  const category = OMNI_INDUSTRY_TAGS[(index * 4 + 1) % OMNI_INDUSTRY_TAGS.length];
  const tag = category.tags[Math.floor(random() * category.tags.length)];
  const region = TAIWAN_REGIONS[Math.floor(random() * TAIWAN_REGIONS.length)];
  const isUrgent = random() > 0.45;
  const coordinate = scatterCoordinate(region, index + 1);
  return {
    id: `gig_seed_${index + 1}`,
    title: `${tag}｜${GIG_TITLE_SUFFIX[index % GIG_TITLE_SUFFIX.length]}`,
    categoryId: category.id,
    tag,
    detail: `${region}現場需要${tag}，希望提供過往實績與可到場時段，現場備有停車位，需自備工具與耗材。`,
    location: { region, source: 'manual' as const, ...coordinate },
    budgetLevel: BUDGETS[Math.floor(random() * BUDGETS.length)],
    isUrgent,
    clientId: `client_seed_${(index % CLIENT_NAMES.length) + 1}`,
    clientName: CLIENT_NAMES[index % CLIENT_NAMES.length],
    createdAt: NOW - Math.floor(random() * 6 * DAY) - index * HOUR,
    status: random() > 0.7 ? 'talking' : 'open',
  } satisfies Gig;
});

/** 示範資料：本機帳號（客戶身分）已發布的任務，用於體驗提案媒合、進行中與評價流程。 */
const MY_DEMO_GIGS: Gig[] = [
  {
    id: 'gig_local_1',
    title: '冷氣維修｜三房不冷需今日到場',
    categoryId: 'CAT_01',
    tag: '冷氣維修',
    detail:
      '臺北市大安區公寓 3 台分離式冷氣同時不冷，室外機有異音，希望今日下午到場檢測並報價，可停車於社區地下室。',
    location: { region: '臺北市', source: 'manual', ...scatterCoordinate('臺北市', 901) },
    budgetLevel: 'B2',
    isUrgent: true,
    clientId: LOCAL_USER_ID,
    clientName: '我',
    createdAt: NOW - 5 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_local_2',
    title: '介面體驗設計｜訂閱頁改版提案',
    categoryId: 'CAT_09',
    tag: '介面體驗設計',
    detail:
      '既有 App 訂閱流程轉換率偏低，需要重新設計方案比較與付款頁，共 6 個畫面，附既有設計檔與數據報表。',
    location: { region: '臺中市', source: 'manual', ...scatterCoordinate('臺中市', 902) },
    budgetLevel: 'B3',
    isUrgent: false,
    clientId: LOCAL_USER_ID,
    clientName: '我',
    createdAt: NOW - 2 * DAY,
    status: 'open',
  },
  {
    id: 'gig_local_3',
    title: '急件到府代工｜辦公室系統櫃組裝',
    categoryId: 'CAT_18',
    tag: '急件到府代工',
    detail: '新辦公室 8 組系統櫃與 12 張桌椅組裝，已完成驗收，感謝師傅假日加班支援。',
    location: { region: '新北市', source: 'manual', ...scatterCoordinate('新北市', 903) },
    budgetLevel: 'B2',
    isUrgent: false,
    clientId: LOCAL_USER_ID,
    clientName: '我',
    createdAt: NOW - 6 * DAY,
    status: 'completed',
    assignedTalentId: 'talent_seed_2',
    assignedTalentName: '李冠廷',
    completedAt: NOW - 3 * HOUR,
  },
];

/** 示範資料：新增專業領域（3C、商用設備、車輛、醫療、農園藝、工業）的實際急件。 */
const NEW_DOMAIN_GIGS: Gig[] = [
  {
    id: 'gig_domain_1',
    title: '手機螢幕更換｜今晚就要拿回手機',
    categoryId: 'CAT_31',
    tag: '手機螢幕更換',
    detail:
      'iPhone 摔破螢幕但觸控正常，希望到府或門市快修，今晚 9 點前完成，請報原廠與副廠兩種價格與保固期。',
    location: { region: '臺北市', source: 'manual', ...scatterCoordinate('臺北市', 911) },
    budgetLevel: 'B2',
    isUrgent: true,
    clientId: 'client_seed_3',
    clientName: CLIENT_NAMES[2],
    createdAt: NOW - 2 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_2',
    title: '硬碟資料救援｜工作檔案急件搶救',
    categoryId: 'CAT_31',
    tag: '硬碟資料救援',
    detail:
      '外接硬碟摔落後電腦讀不到，內有客戶標案檔案，需要開盤前先檢測並報價，成功才付款，可簽保密協議。',
    location: { region: '新竹市', source: 'manual', ...scatterCoordinate('新竹市', 912) },
    budgetLevel: 'B3',
    isUrgent: true,
    clientId: 'client_seed_5',
    clientName: CLIENT_NAMES[4],
    createdAt: NOW - 8 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_3',
    title: '電腦重灌與系統修復｜辦公室 6 台桌機',
    categoryId: 'CAT_31',
    tag: '電腦重灌與系統修復',
    detail:
      '辦公室 6 台桌機開機藍屏且速度極慢，需重灌系統、保留原有資料並加裝固態硬碟，希望假日到場施作。',
    location: { region: '桃園市', source: 'manual', ...scatterCoordinate('桃園市', 913) },
    budgetLevel: 'B3',
    isUrgent: false,
    clientId: 'client_seed_7',
    clientName: CLIENT_NAMES[6],
    createdAt: NOW - 1 * DAY,
    status: 'open',
  },
  {
    id: 'gig_domain_4',
    title: '收銀 POS 系統維護｜開店前必須修好',
    categoryId: 'CAT_32',
    tag: '收銀 POS 系統維護',
    detail:
      '餐飲店 POS 主機無法連線出單機，早上 11 點開店前需排除，附設備型號照片，會員系統資料不可遺失。',
    location: { region: '臺中市', source: 'manual', ...scatterCoordinate('臺中市', 914) },
    budgetLevel: 'B2',
    isUrgent: true,
    clientId: 'client_seed_2',
    clientName: CLIENT_NAMES[1],
    createdAt: NOW - 3 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_5',
    title: '電動車電池模組檢測｜續航驟降需診斷',
    categoryId: 'CAT_33',
    tag: '電動車電池模組檢測',
    detail:
      '電動車近一個月續航從 380 公里掉到 250 公里，儀表偶爾跳警示，需完整電池健康度檢測與衰退報告。',
    location: { region: '高雄市', source: 'manual', ...scatterCoordinate('高雄市', 915) },
    budgetLevel: 'B3',
    isUrgent: false,
    clientId: 'client_seed_9',
    clientName: CLIENT_NAMES[8],
    createdAt: NOW - 20 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_6',
    title: '汽車引擎故障診斷｜引擎燈亮抖動明顯',
    categoryId: 'CAT_33',
    tag: '汽車引擎故障診斷',
    detail:
      '行駛中引擎燈亮起並伴隨抖動，冷車發動更嚴重，希望帶診斷儀到停車場檢測，先報檢測費與維修預估。',
    location: { region: '臺南市', source: 'manual', ...scatterCoordinate('臺南市', 916) },
    budgetLevel: 'B2',
    isUrgent: true,
    clientId: 'client_seed_11',
    clientName: CLIENT_NAMES[10],
    createdAt: NOW - 6 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_7',
    title: '居家護理換藥｜術後傷口每日照護',
    categoryId: 'CAT_34',
    tag: '居家護理換藥',
    detail:
      '長輩術後返家需連續兩週每日換藥與傷口觀察，需具護理師執照，時段為上午 9 至 11 點，家中備有耗材。',
    location: { region: '新北市', source: 'manual', ...scatterCoordinate('新北市', 917) },
    budgetLevel: 'B3',
    isUrgent: false,
    clientId: 'client_seed_4',
    clientName: CLIENT_NAMES[3],
    createdAt: NOW - 1 * DAY - 4 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_8',
    title: '大樹移除與截枝｜颱風前緊急處理',
    categoryId: 'CAT_35',
    tag: '大樹移除與截枝',
    detail:
      '庭院兩棵約六公尺高樹木傾向鄰宅屋頂，颱風前需截枝或移除並清運枝條，現場車輛可進入，需自備吊臂。',
    location: { region: '宜蘭縣', source: 'manual', ...scatterCoordinate('宜蘭縣', 918) },
    budgetLevel: 'B3',
    isUrgent: true,
    clientId: 'client_seed_6',
    clientName: CLIENT_NAMES[5],
    createdAt: NOW - 5 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_9',
    title: '農機具維修｜採收期割草機無法啟動',
    categoryId: 'CAT_35',
    tag: '農機具維修',
    detail:
      '田區割草機與噴霧機同時故障，正值採收期需盡快修復，可到場或協助載運，希望一併保養化油器與皮帶。',
    location: { region: '雲林縣', source: 'manual', ...scatterCoordinate('雲林縣', 919) },
    budgetLevel: 'B2',
    isUrgent: true,
    clientId: 'client_seed_8',
    clientName: CLIENT_NAMES[7],
    createdAt: NOW - 11 * HOUR,
    status: 'open',
  },
  {
    id: 'gig_domain_10',
    title: '專業焊接加工｜產線輸送架補強',
    categoryId: 'CAT_36',
    tag: '專業焊接加工',
    detail:
      '廠內不鏽鋼輸送架焊點斷裂需現場補強，需氬焊經驗與工安證明，可安排夜間停機時段施作，全程有人陪同。',
    location: { region: '彰化縣', source: 'manual', ...scatterCoordinate('彰化縣', 920) },
    budgetLevel: 'B3',
    isUrgent: false,
    clientId: 'client_seed_10',
    clientName: CLIENT_NAMES[9],
    createdAt: NOW - 2 * DAY,
    status: 'open',
  },
  {
    id: 'gig_domain_11',
    title: '消防設備檢修｜年度申報前複檢',
    categoryId: 'CAT_36',
    tag: '消防設備檢修',
    detail:
      '商辦四層樓滅火器、自動撒水與警報主機需檢修並出具申報文件，需具消防設備士資格，可分兩日施作。',
    location: { region: '基隆市', source: 'manual', ...scatterCoordinate('基隆市', 921) },
    budgetLevel: 'B4',
    isUrgent: false,
    clientId: 'client_seed_12',
    clientName: CLIENT_NAMES[11],
    createdAt: NOW - 3 * DAY,
    status: 'talking',
  },
];

export const SEED_GIGS: Gig[] = [...MY_DEMO_GIGS, ...NEW_DOMAIN_GIGS, ...BROADCAST_GIGS];

/** 示範資料：人才對本機客戶任務投遞的提案。 */
export const SEED_BIDS: Bid[] = [
  {
    id: 'bid_seed_1',
    gigId: 'gig_local_1',
    gigTitle: MY_DEMO_GIGS[0].title,
    tag: '冷氣維修',
    clientId: LOCAL_USER_ID,
    talentId: 'talent_seed_1',
    talentName: '王師傅工班',
    talentRegion: '新北市',
    quote: 3200,
    etaLabel: '今天可到',
    message: '兩人一組帶真空泵與冷媒錶，先檢測壓縮機與冷媒壓力，含基本清洗；若需補冷媒另計。',
    createdAt: NOW - 4 * HOUR,
    status: 'pending',
  },
  {
    id: 'bid_seed_2',
    gigId: 'gig_local_1',
    gigTitle: MY_DEMO_GIGS[0].title,
    tag: '冷氣維修',
    clientId: LOCAL_USER_ID,
    talentId: 'talent_seed_4',
    talentName: '林彥丞',
    talentRegion: '臺北市',
    quote: 2800,
    etaLabel: '24 小時內',
    message: '大安區在地師傅，可先視訊看室外機狀況再到場，維修後保固 90 天。',
    createdAt: NOW - 3 * HOUR,
    status: 'pending',
  },
  {
    id: 'bid_seed_3',
    gigId: 'gig_local_1',
    gigTitle: MY_DEMO_GIGS[0].title,
    tag: '冷氣維修',
    clientId: LOCAL_USER_ID,
    talentId: 'talent_seed_11',
    talentName: '柯宥辰',
    talentRegion: '桃園市',
    quote: null,
    etaLabel: '3 天內',
    message: '需先確認機型與樓層高度，到場檢測費 800 元，維修工資依實際狀況報價。',
    createdAt: NOW - 90 * 60 * 1000,
    status: 'pending',
  },
  {
    id: 'bid_seed_4',
    gigId: 'gig_local_2',
    gigTitle: MY_DEMO_GIGS[1].title,
    tag: '介面體驗設計',
    clientId: LOCAL_USER_ID,
    talentId: 'talent_seed_5',
    talentName: '高語彤',
    talentRegion: '臺中市',
    quote: 18000,
    etaLabel: '一週內',
    message: '含 2 版方案比較頁與付款流程重構、可用性測試腳本，交付 Figma 原型與設計規範。',
    createdAt: NOW - 30 * HOUR,
    status: 'pending',
  },
  {
    id: 'bid_seed_5',
    gigId: 'gig_local_2',
    gigTitle: MY_DEMO_GIGS[1].title,
    tag: '介面體驗設計',
    clientId: LOCAL_USER_ID,
    talentId: 'talent_seed_9',
    talentName: '范芷妍',
    talentRegion: '高雄市',
    quote: 15500,
    etaLabel: '時間可再議',
    message: '過去做過三個訂閱制產品改版，可先出低保真線稿確認方向再進視覺。',
    createdAt: NOW - 20 * HOUR,
    status: 'pending',
  },
];

const REVIEW_COMMENTS = [
  '準時到場，狀況說明清楚，收費與報價一致。',
  '施作乾淨俐落，離場前把現場整理得很好。',
  '溝通順暢，願意配合我的時間調整。',
  '專業度高，主動提醒後續保養要注意的地方。',
  '報價透明，沒有臨時加價的情況。',
  '回覆訊息很快，急件當天就處理完成。',
  '交付品質穩定，細節都有依需求修正。',
  '態度親切，會再找他合作。',
];

/** 示範資料：人才收到的歷史評價（平均值與人才檔案分數一致）。 */
export const SEED_REVIEWS: Review[] = SEED_TALENTS.flatMap((talent, talentIndex) => {
  const random = makeRandom(52_000 + talentIndex * 61);
  const count = 2 + (talentIndex % 3);
  return Array.from({ length: count }, (_, reviewIndex) => {
    const category = OMNI_INDUSTRY_TAGS[(talentIndex * 3) % OMNI_INDUSTRY_TAGS.length];
    const tag = talent.tags[reviewIndex % talent.tags.length] ?? category.tags[0];
    const stars = reviewIndex === count - 1 ? Math.max(3, Math.floor(talent.rating)) : 5;
    const authorName = CLIENT_NAMES[(talentIndex * 4 + reviewIndex) % CLIENT_NAMES.length];
    return {
      id: `review_seed_${talentIndex + 1}_${reviewIndex + 1}`,
      gigId: `gig_history_${talentIndex + 1}_${reviewIndex + 1}`,
      gigTitle: `${tag}｜已完成委託`,
      tag,
      authorId: `client_seed_${((talentIndex + reviewIndex) % CLIENT_NAMES.length) + 1}`,
      authorName,
      targetId: talent.id,
      targetName: talent.name,
      targetRole: 'talent' as const,
      stars,
      comment: REVIEW_COMMENTS[Math.floor(random() * REVIEW_COMMENTS.length)],
      createdAt: NOW - (talentIndex + 1) * DAY - reviewIndex * 7 * HOUR,
    } satisfies Review;
  });
});

/** 示範資料：通知中心初始動態。 */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'noti_seed_1',
    kind: 'bid',
    title: '收到 3 份新提案',
    body: '「冷氣維修｜三房不冷需今日到場」已有 3 位認證人才投遞提案。',
    createdAt: NOW - 90 * 60 * 1000,
    isRead: false,
    gigId: 'gig_local_1',
  },
  {
    id: 'noti_seed_2',
    kind: 'bid',
    title: '收到 2 份新提案',
    body: '「介面體驗設計｜訂閱頁改版提案」有新的報價可以比較。',
    createdAt: NOW - 20 * HOUR,
    isRead: false,
    gigId: 'gig_local_2',
  },
  {
    id: 'noti_seed_3',
    kind: 'review',
    title: '任務已完成，等待你的評價',
    body: '「急件到府代工｜辦公室系統櫃組裝」已完成，給李冠廷一個評價。',
    createdAt: NOW - 3 * HOUR,
    isRead: false,
    gigId: 'gig_local_3',
  },
  {
    id: 'noti_seed_4',
    kind: 'system',
    title: '安全提醒',
    body: '所有訊息皆經伺服器端審核，請勿在對話中提供銀行帳號或身分證影本。',
    createdAt: NOW - 3 * DAY,
    isRead: true,
  },
];

function talentAiReview(
  riskScore: number,
  reasons: string[],
  flaggedTerms: string[],
  submittedAt: number,
): AiReviewResult {
  return {
    target: 'talent',
    decision: riskScore >= 60 ? 'rejected' : 'review',
    riskScore,
    reasons,
    flaggedTerms,
    engine: 'rules',
    reviewedAt: submittedAt,
  };
}

export const SEED_VERIFICATIONS: VerificationRequest[] = [
  {
    id: 'ver_1',
    talentId: 'talent_seed_1',
    talentName: '王師傅工班',
    region: '新北市',
    tags: ['水電工程', '漏水抓漏', '壁癌根治'],
    submittedAt: NOW - 5 * HOUR,
    status: 'pending',
    note: 'AI 認證未通過：服務說明含站外聯絡方式，需人工確認',
    aiReview: talentAiReview(
      35,
      ['內容含個人聯絡資訊，建議改由平台對話聯繫'],
      ['加我line'],
      NOW - 5 * HOUR,
    ),
  },
  {
    id: 'ver_2',
    talentId: 'talent_seed_5',
    talentName: '高語彤',
    region: '臺中市',
    tags: ['介面體驗設計', '品牌識別標誌'],
    submittedAt: NOW - 11 * HOUR,
    status: 'pending',
    note: 'AI 認證未通過：作品說明含誇大收益字樣，需人工確認',
    aiReview: talentAiReview(
      30,
      ['疑似誇大收益或投資話術（命中 保證獲利）'],
      ['保證獲利'],
      NOW - 11 * HOUR,
    ),
  },
  {
    id: 'ver_3',
    talentId: 'talent_seed_9',
    talentName: '范芷妍',
    region: '高雄市',
    tags: ['到府月嫂護理', '緊急居家看護'],
    submittedAt: NOW - 26 * HOUR,
    status: 'pending',
    note: 'AI 認證未通過：醫療照護類服務需人工確認資格描述',
    aiReview: talentAiReview(
      32,
      ['醫療照護類服務描述需人工確認', '內容含個人聯絡資訊'],
      [],
      NOW - 26 * HOUR,
    ),
  },
  {
    id: 'ver_4',
    talentId: 'talent_seed_12',
    talentName: '潘思穎',
    region: '桃園市',
    tags: ['寵物美容洗澡', '寵物行為訓練'],
    submittedAt: NOW - 2 * DAY,
    status: 'pending',
    note: 'AI 認證未通過：服務說明要求先付訂金，需人工確認',
    aiReview: talentAiReview(
      45,
      ['要求預付款項或提供金融個資（命中 先付訂金）'],
      ['先付訂金'],
      NOW - 2 * DAY,
    ),
  },
  {
    id: 'ver_5',
    talentId: 'talent_seed_7',
    talentName: '簡佩容',
    region: '臺北市',
    tags: ['中英商務翻譯', '技術文件撰寫'],
    submittedAt: NOW - 3 * DAY,
    status: 'pending',
    note: 'AI 認證未通過：內容引導至站外交易，需人工確認',
    aiReview: talentAiReview(38, ['引導離開平台私下交易（命中 站外）'], ['站外'], NOW - 3 * DAY),
  },
];

function buildTranscript(
  conversationId: string,
  lines: { senderId: string; senderName: string; text: string }[],
): ChatMessage[] {
  return lines.map((line, index) => {
    const moderated = moderateText(line.text);
    return {
      id: `${conversationId}_m${index + 1}`,
      conversationId,
      senderId: line.senderId,
      senderName: line.senderName,
      text: line.text,
      at: NOW - (lines.length - index) * 12 * 60 * 1000,
      moderation: moderated.moderation,
      flaggedTerms: moderated.flaggedTerms,
    } satisfies ChatMessage;
  });
}

export const SEED_REPORTS: AbuseReport[] = [
  {
    id: 'report_1',
    conversationId: 'conv_seed_1',
    reportedUserId: 'talent_seed_3',
    reportedUserName: '周雅玲',
    reporterName: '林雅婷',
    reason: '要求離開平台交易並索取銀行帳號',
    createdAt: NOW - 4 * HOUR,
    resolved: false,
    transcript: buildTranscript('conv_seed_1', [
      { senderId: 'client_seed_1', senderName: '林雅婷', text: '您好，週六可以到現場估價嗎？' },
      {
        senderId: 'talent_seed_3',
        senderName: '周雅玲',
        text: '可以，不過我們習慣私下聊，你先付訂金 3000 到我的銀行帳號比較快。',
      },
      { senderId: 'client_seed_1', senderName: '林雅婷', text: '平台上不是可以直接處理嗎？' },
      {
        senderId: 'talent_seed_3',
        senderName: '周雅玲',
        text: '離開平台手續費比較低，直接私下匯款就好。',
      },
    ]),
  },
  {
    id: 'report_2',
    conversationId: 'conv_seed_2',
    reportedUserId: 'talent_seed_8',
    reportedUserName: '莊立宇',
    reporterName: '陳建豪',
    reason: '疑似投資詐騙話術',
    createdAt: NOW - 20 * HOUR,
    resolved: false,
    transcript: buildTranscript('conv_seed_2', [
      { senderId: 'client_seed_2', senderName: '陳建豪', text: '網站速度優化的報價方式是？' },
      {
        senderId: 'talent_seed_8',
        senderName: '莊立宇',
        text: '報價再談，我這邊還有投資獲利的方案，虛擬貨幣操作月報酬很高。',
      },
      { senderId: 'client_seed_2', senderName: '陳建豪', text: '我只想處理網站的問題。' },
      {
        senderId: 'talent_seed_8',
        senderName: '莊立宇',
        text: '那你先把身分證影本傳給我開立合約。',
      },
    ]),
  },
  {
    id: 'report_3',
    conversationId: 'conv_seed_3',
    reportedUserId: 'client_seed_6',
    reportedUserName: '劉宜臻',
    reporterName: '李冠廷',
    reason: '要求先支付保證金才能接案',
    createdAt: NOW - 2 * DAY,
    resolved: false,
    transcript: buildTranscript('conv_seed_3', [
      { senderId: 'client_seed_6', senderName: '劉宜臻', text: '這個案子要先繳保證金 2000。' },
      { senderId: 'talent_seed_2', senderName: '李冠廷', text: '平台規定不需要收保證金。' },
      {
        senderId: 'client_seed_6',
        senderName: '劉宜臻',
        text: '你匯款後我就把案子給你，用代收帳戶就好。',
      },
    ]),
  },
];

/** 平台歷史基準值（示範資料）。 */
export const PLATFORM_BASELINE = {
  totalClients: 9_642,
  totalTalents: 4_318,
  premiumTalents: 236,
  broadcastedGigs: 3_184,
  matchedGigs: 2_071,
};

export const WEEK_LABELS: string[] = Array.from({ length: 12 }, (_, index) => `第${index + 1}週`);

/** 每週任務頻率趨勢：依旗艦產業類別分開統計。 */
export const WEEKLY_TREND_BY_CATEGORY: Record<string, WeeklyPoint[]> = Object.fromEntries(
  OMNI_INDUSTRY_TAGS.map((category, categoryIndex) => {
    const random = makeRandom(7000 + categoryIndex * 131);
    const base = 24 + Math.floor(random() * 60);
    const points = WEEK_LABELS.map((weekLabel, weekIndex) => ({
      weekLabel,
      value: Math.max(
        6,
        Math.round(base + weekIndex * (1 + random() * 2.4) + (random() - 0.5) * base * 0.35),
      ),
    }));
    return [category.id, points];
  }),
);

export const WEEKLY_TREND_ALL: WeeklyPoint[] = WEEK_LABELS.map((weekLabel, weekIndex) => ({
  weekLabel,
  value: Object.values(WEEKLY_TREND_BY_CATEGORY).reduce(
    (sum, points) => sum + points[weekIndex].value,
    0,
  ),
}));

export interface TagHeatEntry {
  tag: string;
  categoryId: string;
  activity: number;
}

export const SEED_TAG_HEAT: TagHeatEntry[] = (() => {
  const entries: TagHeatEntry[] = [];
  OMNI_INDUSTRY_TAGS.forEach((category, categoryIndex) => {
    category.tags.forEach((tag, tagIndex) => {
      const random = makeRandom(31_000 + categoryIndex * 97 + tagIndex * 13);
      entries.push({
        tag,
        categoryId: category.id,
        activity: Math.round(12 + random() * 180),
      });
    });
  });
  return entries;
})();
