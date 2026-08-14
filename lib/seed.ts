import { OMNI_INDUSTRY_TAGS } from '@/lib/omniTags';
import { TAIWAN_REGIONS } from '@/lib/regions';
import { moderateText } from '@/lib/moderation';
import type {
  AbuseReport,
  BudgetLevelId,
  ChatMessage,
  Gig,
  TalentProfile,
  VerificationRequest,
  WeeklyPoint,
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

export const SEED_TALENTS: TalentProfile[] = TALENT_NAMES.map((name, index) => {
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
  };
});

export const SEED_GIGS: Gig[] = Array.from({ length: 26 }, (_, index) => {
  const random = makeRandom(500 + index * 91);
  const category = OMNI_INDUSTRY_TAGS[(index * 4 + 1) % OMNI_INDUSTRY_TAGS.length];
  const tag = category.tags[Math.floor(random() * category.tags.length)];
  const region = TAIWAN_REGIONS[Math.floor(random() * TAIWAN_REGIONS.length)];
  const isUrgent = random() > 0.45;
  return {
    id: `gig_seed_${index + 1}`,
    title: `${tag}｜${GIG_TITLE_SUFFIX[index % GIG_TITLE_SUFFIX.length]}`,
    categoryId: category.id,
    tag,
    detail: `${region}現場需要${tag}，希望提供過往實績與可到場時段，現場備有停車位，需自備工具與耗材。`,
    location: { region, source: 'manual' as const },
    budgetLevel: BUDGETS[Math.floor(random() * BUDGETS.length)],
    isUrgent,
    clientId: `client_seed_${(index % CLIENT_NAMES.length) + 1}`,
    clientName: CLIENT_NAMES[index % CLIENT_NAMES.length],
    createdAt: NOW - Math.floor(random() * 6 * DAY) - index * HOUR,
    status: random() > 0.7 ? 'talking' : 'open',
  } satisfies Gig;
});

export const SEED_VERIFICATIONS: VerificationRequest[] = [
  {
    id: 'ver_1',
    talentId: 'talent_seed_1',
    talentName: '王師傅工班',
    region: '新北市',
    tags: ['水電工程', '漏水抓漏', '壁癌根治'],
    submittedAt: NOW - 5 * HOUR,
    status: 'pending',
    note: '已上傳甲級技術士證照與工程行登記證',
  },
  {
    id: 'ver_2',
    talentId: 'talent_seed_5',
    talentName: '高語彤',
    region: '臺中市',
    tags: ['介面體驗設計', '品牌識別標誌'],
    submittedAt: NOW - 11 * HOUR,
    status: 'pending',
    note: '作品集連結與設計協會會員證',
  },
  {
    id: 'ver_3',
    talentId: 'talent_seed_9',
    talentName: '范芷妍',
    region: '高雄市',
    tags: ['到府月嫂護理', '緊急居家看護'],
    submittedAt: NOW - 26 * HOUR,
    status: 'pending',
    note: '護理師執業執照，需核對照片與本人',
  },
  {
    id: 'ver_4',
    talentId: 'talent_seed_12',
    talentName: '潘思穎',
    region: '桃園市',
    tags: ['寵物美容洗澡', '寵物行為訓練'],
    submittedAt: NOW - 2 * DAY,
    status: 'pending',
    note: '寵物美容乙級證書',
  },
  {
    id: 'ver_5',
    talentId: 'talent_seed_7',
    talentName: '簡佩容',
    region: '臺北市',
    tags: ['中英商務翻譯', '技術文件撰寫'],
    submittedAt: NOW - 3 * DAY,
    status: 'pending',
    note: '口筆譯認證與過往稿件',
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

/** 每週任務頻率趨勢：依 30 大旗艦類別分開統計。 */
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
