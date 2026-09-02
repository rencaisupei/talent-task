import type {
  AiCadence,
  AiContentConfig,
  AiContentKind,
  AiPatrolAction,
  AiPatrolConfig,
  AiPatrolScope,
  AiSensitivity,
  AiSeverity,
  AiTone,
} from '@/lib/types';

/* ------------------------------------------------------------ 標籤字典 */

export const SENSITIVITY_LABEL: Record<AiSensitivity, string> = {
  loose: '寬鬆',
  standard: '標準',
  strict: '嚴格',
};

export const SENSITIVITY_HINT: Record<AiSensitivity, string> = {
  loose: '只攔詐騙、色情、未成年等高風險內容',
  standard: '再加上聯絡資訊、站外連結與辱罵',
  strict: '連擦邊與可疑用語都送審，誤判率較高',
};

export const SCOPE_LABEL: Record<AiPatrolScope, string> = {
  moments: '動態貼文',
  comments: '動態留言',
  chats: '聊天訊息',
  profiles: '個人檔案自介',
};

export const ACTION_LABEL: Record<AiPatrolAction, string> = {
  log: '只記錄',
  queue: '送人工待審',
  hide: '立即隱藏',
};

export const ACTION_HINT: Record<AiPatrolAction, string> = {
  log: '寫進巡邏紀錄，不動到內容',
  queue: '同步排進管理員平台的待審佇列',
  hide: '先下架動態再等人工覆核',
};

export const SEVERITY_LABEL: Record<AiSeverity, string> = {
  low: '輕微',
  medium: '中等',
  high: '高風險',
};

export const CADENCE_LABEL: Record<AiCadence, string> = {
  manual: '只手動',
  daily: '每天一次',
  weekly: '每週一次',
};

export const CADENCE_MS: Record<AiCadence, number> = {
  manual: 0,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export const TONE_LABEL: Record<AiTone, string> = {
  warm: '溫和',
  balanced: '平衡',
  bold: '大膽',
};

export const KIND_LABEL: Record<AiContentKind, string> = {
  quick: '快問快答',
  truth: '真心話',
  dare: '大冒險',
};

export const PATROL_INTERVALS = [15, 30, 60, 180] as const;

export const DEFAULT_PATROL: AiPatrolConfig = {
  enabled: true,
  intervalMinutes: 30,
  sensitivity: 'standard',
  scopes: ['moments', 'comments', 'chats', 'profiles'],
  action: 'queue',
  notifyAdmin: true,
};

export const DEFAULT_CONTENT: AiContentConfig = {
  enabled: true,
  cadence: 'daily',
  autoPublish: true,
  kinds: ['quick', 'truth', 'dare'],
  tone: 'balanced',
  batchSize: 6,
};

/* ------------------------------------------------------------ 巡邏規則 */

export interface PatrolRule {
  id: string;
  label: string;
  severity: AiSeverity;
  pattern: RegExp;
}

/** 規則由重到輕排序，命中第一條就記錄。 */
export const PATROL_RULES: PatrolRule[] = [
  {
    id: 'fraud',
    label: '疑似金錢誘導',
    severity: 'high',
    pattern: /(包養|援交|匯款|轉帳|代操|穩賺|保證獲利|日賺|出金|下注|博弈|博彩|投資群)/,
  },
  {
    id: 'adult',
    label: '成人或性交易暗示',
    severity: 'high',
    pattern: /(約砲|一夜|開房|外約|裸聊|裸照|情色|上車價)/,
  },
  {
    id: 'minor',
    label: '疑似未成年',
    severity: 'high',
    pattern: /(未成年|國中生|高中生|國一|國二|國三|1[0-7]\s*歲)/,
  },
  {
    id: 'contact',
    label: '聯絡資訊外流',
    severity: 'medium',
    pattern:
      /(加(我)?(賴|line)|line\s*id|賴\s*id|微信|wechat|telegram|whats?app|ig\s*[:：@])|09\d{2}[-\s]?\d{3}[-\s]?\d{3}/i,
  },
  {
    id: 'offsite',
    label: '站外連結',
    severity: 'medium',
    pattern: /(https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}|[a-z0-9-]+\.(com|net|shop|xyz|top)\b)/i,
  },
  {
    id: 'harass',
    label: '辱罵或人身攻擊',
    severity: 'medium',
    pattern: /(智障|白痴|去死|滾開|廢物|醜死|婊)/,
  },
  {
    id: 'lure',
    label: '疑似拉客導流',
    severity: 'low',
    pattern: /(私訊我|限時優惠|優惠碼|免費領|加入群組|團購|代購|報名表單)/,
  },
  {
    id: 'meta',
    label: '擦邊試探用語',
    severity: 'low',
    pattern: /(在嗎.{0,4}美女|要不要出來|老司機|你懂的|有需求)/,
  },
];

const SEVERITY_RANK: Record<AiSeverity, number> = { low: 1, medium: 2, high: 3 };

const SENSITIVITY_THRESHOLD: Record<AiSensitivity, number> = {
  loose: 3,
  standard: 2,
  strict: 1,
};

export interface RuleHit {
  rule: string;
  severity: AiSeverity;
}

/** 依嚴格度掃一段文字，回傳最嚴重的命中結果。 */
export function matchText(
  text: string,
  sensitivity: AiSensitivity,
  bannedWords: string[],
): RuleHit | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const banned = bannedWords.find((word) => word.trim() && trimmed.includes(word.trim()));
  if (banned) return { rule: `站規敏感詞「${banned}」`, severity: 'high' };

  const threshold = SENSITIVITY_THRESHOLD[sensitivity];
  for (const rule of PATROL_RULES) {
    if (SEVERITY_RANK[rule.severity] < threshold) continue;
    if (rule.pattern.test(trimmed)) return { rule: rule.label, severity: rule.severity };
  }
  return null;
}

/* -------------------------------------------------------- 題目產生素材 */

interface Seed {
  text: string;
  /** 0 = 溫和，1 = 一般，2 = 大膽。 */
  heat: 0 | 1 | 2;
}

const TONE_HEAT: Record<AiTone, number> = { warm: 0, balanced: 1, bold: 2 };

const QUICK_SITUATIONS: Seed[] = [
  { text: '第一次約會', heat: 0 },
  { text: '連續加班一整週之後', heat: 0 },
  { text: '週末突然多出一天空檔', heat: 0 },
  { text: '一起出門旅行時', heat: 0 },
  { text: '朋友聚會上遇到對方', heat: 0 },
  { text: '對方已讀不回三小時', heat: 1 },
  { text: '半夜兩點都還醒著', heat: 1 },
  { text: '冷戰的第二天', heat: 1 },
  { text: '對方喝了一點酒之後', heat: 2 },
  { text: '確認關係的前一晚', heat: 2 },
];

const QUICK_OPTIONS: { a: string; b: string; heat: 0 | 1 | 2 }[] = [
  { a: '直接說出想法', b: '等對方先開口', heat: 0 },
  { a: '行程排到滿', b: '走到哪算哪', heat: 0 },
  { a: '先吃一頓好的', b: '先散步聊天', heat: 0 },
  { a: '打電話', b: '傳訊息', heat: 0 },
  { a: '在家煮一頓', b: '找一間新餐廳', heat: 0 },
  { a: '主動找話題', b: '安靜陪著就好', heat: 1 },
  { a: '把話講到底', b: '留一點給明天', heat: 1 },
  { a: '先道歉', b: '先問清楚', heat: 1 },
  { a: '直接牽手', b: '等對方靠過來', heat: 2 },
  { a: '一次講完真心話', b: '慢慢讓對方猜', heat: 2 },
];

const TRUTH_OPENERS = ['老實說，', '不准跳題：', '這題只能誠實回答：', '就這一次：'];

const TRUTH_TOPICS: Seed[] = [
  { text: '你手機裡最捨不得刪的那張照片是什麼？', heat: 0 },
  { text: '上一次覺得心動是什麼情境？', heat: 0 },
  { text: '你最希望對方記住你的哪一點？', heat: 0 },
  { text: '你最不想被交往對象發現的小習慣是什麼？', heat: 1 },
  { text: '你曾經偷偷看過對方的檔案幾次才敢傳訊息？', heat: 1 },
  { text: '交往之後你最受不了對方做什麼？', heat: 1 },
  { text: '如果今天可以對前任說一句話，你會說什麼？', heat: 2 },
  { text: '你談過最短的一段感情有多短，為什麼結束？', heat: 2 },
  { text: '你最後一次為了誰失眠是什麼時候？', heat: 2 },
];

const DARE_ACTIONS: Seed[] = [
  { text: '用語音訊息唱一句歌給對方聽', heat: 0 },
  { text: '傳一張你現在的視角照片', heat: 0 },
  { text: '用三個字形容對方', heat: 0 },
  { text: '講一件今天發生、只有你知道的事', heat: 0 },
  { text: '模仿對方的說話語氣講一句話', heat: 1 },
  { text: '公開你最近播放清單的第一首歌', heat: 1 },
  { text: '對著鏡頭做一個你最不擅長的表情', heat: 1 },
  { text: '傳一句開頭是「其實我一直想說」的訊息', heat: 2 },
  { text: '把你手機相簿最後一張照片傳出來', heat: 2 },
];

const DARE_TWISTS = ['，而且不能笑。', '，限時 30 秒。', '，不能重來。', '，全場都要看得到。'];

function allowed(heat: number, tone: AiTone) {
  return heat <= TONE_HEAT[tone];
}

function pickFrom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export interface GeneratedContent {
  text: string;
  options?: [string, string];
}

/**
 * 依語氣把素材重新組合成一則新題目，並避開 `taken` 裡已存在的文字。
 * 組合都用完時回傳 null。
 */
export function generateContent(
  kind: AiContentKind,
  tone: AiTone,
  taken: Set<string>,
): GeneratedContent | null {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const draft = compose(kind, tone);
    if (!draft) return null;
    if (!taken.has(draft.text)) return draft;
  }
  return null;
}

function compose(kind: AiContentKind, tone: AiTone): GeneratedContent | null {
  if (kind === 'quick') {
    const situation = pickFrom(QUICK_SITUATIONS.filter((item) => allowed(item.heat, tone)));
    const option = pickFrom(QUICK_OPTIONS.filter((item) => allowed(item.heat, tone)));
    if (!situation || !option) return null;
    return {
      text: `${situation.text}，你會…`,
      options: [option.a, option.b],
    };
  }

  if (kind === 'truth') {
    const opener = pickFrom(TRUTH_OPENERS);
    const topic = pickFrom(TRUTH_TOPICS.filter((item) => allowed(item.heat, tone)));
    if (!opener || !topic) return null;
    return { text: `${opener}${topic.text}` };
  }

  const action = pickFrom(DARE_ACTIONS.filter((item) => allowed(item.heat, tone)));
  const twist = pickFrom(DARE_TWISTS);
  if (!action || !twist) return null;
  return { text: `${action.text}${twist}` };
}
