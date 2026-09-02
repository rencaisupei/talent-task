import type { BoardTile, GameRoom, LeaderboardEntry, QuickQuestion } from '@/lib/types';

/** 進入一場遊戲要花的體力。 */
export const STAMINA_COST = {
  quick: 1,
  board: 1,
  room: 1,
} as const;

export const STAMINA_MAX = 5;
/** 每 12 分鐘回復 1 點體力。 */
export const STAMINA_REGEN_MS = 12 * 60 * 1000;
/** 用心動代幣直接補 1 點體力的價格。 */
export const STAMINA_REFILL_COINS = 60;

/** 心動值達到這個值就解鎖真愛（自動配對並開聊天室）。 */
export const AFFINITY_UNLOCK = 100;
/** 一場大富翁可以擲的次數。 */
export const BOARD_ROLLS = 10;

/* ------------------------------------------------------------ 極速開局 */

export const QUICK_QUESTIONS: QuickQuestion[] = [
  { id: 'q1', question: '週末的理想開場', options: ['市場買菜一起煮', '臨時決定跳上火車'] },
  { id: 'q2', question: '第一次約會你想去', options: ['深夜居酒屋', '早場電影'] },
  { id: 'q3', question: '吵架之後你會', options: ['當場講清楚', '先各自冷靜一晚'] },
  { id: 'q4', question: '旅行你偏好', options: ['行程排到滿', '走到哪算哪'] },
  { id: 'q5', question: '你更在意對方的', options: ['幽默感', '穩定感'] },
  { id: 'q6', question: '深夜訊息你會', options: ['秒回', '隔天早上一起回'] },
];

export const QUICK_MATCH_LINES = [
  '正在掃描附近正在線上的玩家…',
  '找到 3 位頻率接近的人…',
  '比對興趣與作息…',
  '鎖定對手，準備開局！',
];

/* -------------------------------------------------------------- 大富翁 */

/** 24 格環形棋盤（7×7 外框），順時針從左上角起點開始。 */
export const BOARD_TILES: BoardTile[] = [
  { index: 0, kind: 'start', label: '起點' },
  { index: 1, kind: 'truth', label: '真心話' },
  { index: 2, kind: 'coins', label: '代幣' },
  { index: 3, kind: 'heart', label: '心動' },
  { index: 4, kind: 'dare', label: '大冒險' },
  { index: 5, kind: 'chance', label: '機會' },
  { index: 6, kind: 'trap', label: '尷尬' },
  { index: 7, kind: 'truth', label: '真心話' },
  { index: 8, kind: 'stamina', label: '體力' },
  { index: 9, kind: 'heart', label: '心動' },
  { index: 10, kind: 'dare', label: '大冒險' },
  { index: 11, kind: 'coins', label: '代幣' },
  { index: 12, kind: 'date', label: '約會格' },
  { index: 13, kind: 'heart', label: '心動' },
  { index: 14, kind: 'chance', label: '機會' },
  { index: 15, kind: 'dare', label: '大冒險' },
  { index: 16, kind: 'coins', label: '代幣' },
  { index: 17, kind: 'truth', label: '真心話' },
  { index: 18, kind: 'trap', label: '尷尬' },
  { index: 19, kind: 'heart', label: '心動' },
  { index: 20, kind: 'dare', label: '大冒險' },
  { index: 21, kind: 'stamina', label: '體力' },
  { index: 22, kind: 'chance', label: '機會' },
  { index: 23, kind: 'truth', label: '真心話' },
];

export const TRUTH_CARDS = [
  '上一次心動是什麼場景？',
  '你最不想被交往對象知道的小習慣？',
  '手機裡最久沒刪的一張照片是什麼？',
  '你談過最短的一段感情多長？',
  '如果今天可以對前任說一句話，你會說什麼？',
  '你偷偷觀察過對方多久才敢傳訊息？',
  '你最容易被哪一種舉動打動？',
  '交往後你最受不了對方做什麼？',
];

export const DARE_CARDS = [
  '用語音訊息唱一句歌給對方聽。',
  '傳一張你現在的視角照片。',
  '用三個字形容對方，不能重複。',
  '講一件今天發生、只有你知道的事。',
  '模仿對方的說話語氣講一句話。',
  '公開你的最近播放清單第一首。',
  '對著鏡頭做一個你最不擅長的表情。',
  '傳訊息給對方，開頭必須是「其實我一直想說」。',
];

export const CHANCE_EVENTS = [
  { label: '對方主動遞了一杯熱可可', hearts: 12, coins: 0 },
  { label: '路邊抓娃娃機一次就中', hearts: 4, coins: 30 },
  { label: '你們同時說出同一句話', hearts: 15, coins: 0 },
  { label: '撿到限時任務卡', hearts: 0, coins: 45 },
  { label: '同時被雨困在同一個屋簷下', hearts: 10, coins: 10 },
] as const;

export const TRAP_EVENTS = [
  '你把對方的名字唸錯了。',
  '手機沒電，冷場三分鐘。',
  '你聊到前任，氣氛瞬間安靜。',
  '你把對方最愛的樂團說成很吵。',
] as const;

/* ------------------------------------------------------------ 派對房間 */

export const GAME_ROOMS: GameRoom[] = [
  {
    id: 'r1',
    game: 'truth-dare',
    tag: '#真心話大冒險',
    title: '深夜實話局',
    hostId: 'u1',
    playerIds: ['u1', 'u3', 'u7', 'u13'],
    males: 3,
    females: 2,
    capacity: 6,
    rewardCoins: 120,
    hot: true,
  },
  {
    id: 'r2',
    game: 'werewolf',
    tag: '#天黑請閉眼',
    title: '新手友善狼人局',
    hostId: 'u5',
    playerIds: ['u5', 'u2', 'u9', 'u13'],
    males: 2,
    females: 3,
    capacity: 6,
    rewardCoins: 180,
    hot: true,
  },
  {
    id: 'r3',
    game: 'truth-dare',
    tag: '#真心話大冒險',
    title: '只問感情問題',
    hostId: 'u4',
    playerIds: ['u4', 'u8', 'u10'],
    males: 1,
    females: 3,
    capacity: 5,
    rewardCoins: 90,
    hot: false,
  },
  {
    id: 'r4',
    game: 'werewolf',
    tag: '#天黑請閉眼',
    title: '進階狼人・會發言的才進',
    hostId: 'u7',
    playerIds: ['u7', 'u6', 'u12', 'u14', 'u11'],
    males: 2,
    females: 4,
    capacity: 7,
    rewardCoins: 240,
    hot: false,
  },
  {
    id: 'r5',
    game: 'truth-dare',
    tag: '#真心話大冒險',
    title: '大膽一點沒關係',
    hostId: 'u9',
    playerIds: ['u9', 'u1', 'u11', 'u13'],
    males: 2,
    females: 3,
    capacity: 6,
    rewardCoins: 150,
    hot: false,
  },
  {
    id: 'r6',
    game: 'werewolf',
    tag: '#天黑請閉眼',
    title: '午夜快速局・10 分鐘結束',
    hostId: 'u12',
    playerIds: ['u12', 'u2', 'u3'],
    males: 1,
    females: 3,
    capacity: 5,
    rewardCoins: 110,
    hot: false,
  },
];

export function roomById(id: string | undefined): GameRoom | undefined {
  return GAME_ROOMS.find((room) => room.id === id);
}

/** 房間還差幾個人才能開局。 */
export function roomSlotsLeft(room: GameRoom): number {
  return Math.max(1, room.capacity - room.playerIds.length - 1);
}

export const TRUTH_DARE_BOT_LINES = [
  '這題我要想一下…好，我說實話。',
  '哇這也太直接了吧，但我接。',
  '我選大冒險，真心話太可怕。',
  '好啦好啦我承認，是我先偷看檔案的。',
  '這題等等換你回答喔。',
  '我發現我們作息超像，這樣算加分嗎？',
];

export const WEREWOLF_DAY_LINES = [
  '我覺得剛剛講話最少的那位很可疑。',
  '我是好人，第一晚就被查驗過了。',
  '不要急著投，先聽完一輪。',
  '有人在帶風向，我不跟。',
  '我押那位講得太順的。',
];

/* -------------------------------------------------------------- 排行榜 */

export const LEADERBOARD_SEED: LeaderboardEntry[] = [
  { userId: 'u1', score: 4820, wins: 41, title: '心動收割機' },
  { userId: 'u7', score: 4415, wins: 38, title: '狼王' },
  { userId: 'u5', score: 3980, wins: 33, title: '棋盤策士' },
  { userId: 'u9', score: 3610, wins: 30, title: '真心話大師' },
  { userId: 'u13', score: 3255, wins: 26, title: '派對常駐' },
  { userId: 'u3', score: 2870, wins: 22, title: '氣氛製造機' },
  { userId: 'u2', score: 2540, wins: 19, title: '沉默殺手' },
  { userId: 'u10', score: 2210, wins: 17, title: '骰運極佳' },
  { userId: 'u12', score: 1930, wins: 14, title: '新人王' },
  { userId: 'u6', score: 1680, wins: 12, title: '穩定發揮' },
  { userId: 'u14', score: 1420, wins: 9, title: '深夜玩家' },
  { userId: 'u4', score: 1180, wins: 7, title: '剛剛入城' },
];

export const PLAYER_TITLES = [
  { min: 0, title: '遊戲城新住民' },
  { min: 300, title: '暖場高手' },
  { min: 900, title: '心動獵人' },
  { min: 1800, title: '派對常勝軍' },
  { min: 3200, title: '遊戲城傳說' },
] as const;

export function titleForScore(score: number): string {
  let title: string = PLAYER_TITLES[0].title;
  for (const step of PLAYER_TITLES) {
    if (score >= step.min) title = step.title;
  }
  return title;
}

/** 把「我」插進本週排行榜並重新排序。 */
export function buildRanking(myScore: number, myWins: number): LeaderboardEntry[] {
  const mine: LeaderboardEntry = {
    userId: 'me',
    score: myScore,
    wins: myWins,
    title: titleForScore(myScore),
  };
  return [...LEADERBOARD_SEED, mine].sort((a, b) => b.score - a.score);
}
