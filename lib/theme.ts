/**
 * Brand gradient / glow colors.
 *
 * Semantic colors (accent, foreground, muted, border, ...) must be read with
 * HeroUI's `useThemeColor` so light/dark tokens stay in sync. The values here
 * are the neon brand ramp used by expo-linear-gradient and decorative icons,
 * which need plain React Native parseable color strings and have no HeroUI
 * semantic equivalent.
 */
export const NEON = {
  pink: '#FF6B84',
  coral: '#FF5F7E',
  rose: '#F2589F',
  violet: '#A855F7',
  indigo: '#6C63FF',
  cyan: '#5CD1EC',
  amber: '#FFC24D',
  lime: '#A8F05A',
  night: '#171021',
  nightDeep: '#0F0A16',
  surface: '#241A32',
} as const;

/**
 * 遊戲城（Game Hub）專屬色票。只有遊戲相關畫面使用這組配色：
 * 沉浸式暗黑底 #121212，搭配橙 → 粉 → 紫漸層與金色儲值色。
 * 對應的 className token 定義在 global.css 的 --color-game-*。
 */
export const GAME = {
  base: '#121212',
  card: '#1A181D',
  raised: '#231F28',
  line: 'rgba(255,255,255,0.12)',
  orange: '#FF8A3D',
  pink: '#FF4F9A',
  violet: '#A855F7',
  gold: '#FFC53D',
  cyan: '#38E1FF',
  mint: '#4CE0A5',
  text: '#F7F4F8',
  muted: '#9C93A3',
} as const;

export const GRADIENT = {
  brand: [NEON.coral, NEON.rose, NEON.violet] as const,
  like: ['#2FD68A', '#5CD1EC'] as const,
  superLike: [NEON.cyan, NEON.violet] as const,
  nope: ['#6B6478', '#3A2C4C'] as const,
  vip: [NEON.amber, NEON.coral] as const,
  plus: [NEON.violet, NEON.cyan] as const,
  coin: [NEON.amber, '#FF9A3C'] as const,
  screenGlow: ['rgba(255,95,126,0.20)', 'rgba(168,85,247,0.10)', 'rgba(23,16,33,0)'] as const,
  cardShade: ['rgba(15,10,22,0)', 'rgba(15,10,22,0.55)', 'rgba(15,10,22,0.94)'] as const,
  callBackdrop: ['#2A1230', '#171021', '#0F0A16'] as const,
  /** 遊戲城：橙 → 粉 → 紫 */
  game: [GAME.orange, GAME.pink, GAME.violet] as const,
  gameGlow: [
    'rgba(255,138,61,0.38)',
    'rgba(255,79,154,0.24)',
    'rgba(168,85,247,0.14)',
    'rgba(18,18,18,0)',
  ] as const,
  gameGold: ['#FFD976', GAME.gold, '#F59A13'] as const,
  gameNeon: [GAME.pink, GAME.violet] as const,
  gameBoard: ['#241A2E', '#16121C'] as const,
  gameRoom: ['rgba(255,138,61,0.16)', 'rgba(168,85,247,0.16)'] as const,
} as const;
