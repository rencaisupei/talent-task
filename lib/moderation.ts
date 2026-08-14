import type { ChatMessage, ModerationState } from '@/lib/types';

/** 伺服器端聊天審核：詐騙與私下交易關鍵字字典。 */
export const SCAM_KEYWORDS = [
  '私下匯款',
  '匯款',
  '代收帳戶',
  '保證金',
  '先付訂金',
  '解除分期',
  '投資獲利',
  '虛擬貨幣',
  '加我帳號',
  '私下聊',
  '代刷',
  '刷卡換現',
  '身分證影本',
  '銀行帳號',
  '離開平台',
];

export function detectScamTerms(text: string): string[] {
  const lowered = text.replace(/\s+/g, '');
  return SCAM_KEYWORDS.filter((keyword) => lowered.includes(keyword));
}

export function moderateText(text: string): {
  moderation: ModerationState;
  flaggedTerms: string[];
} {
  const flaggedTerms = detectScamTerms(text);
  return { moderation: flaggedTerms.length > 0 ? 'flagged' : 'clean', flaggedTerms };
}

export interface TranscriptSegment {
  /** 該片段在原始訊息中的起始字元位移，可作為穩定、資料相依的 React key。 */
  offset: number;
  text: string;
  isFlagged: boolean;
}

/** 將訊息切成「一般 / 高亮」片段，供管理端粗體標示詐騙關鍵字。 */
export function segmentTranscript(message: ChatMessage): TranscriptSegment[] {
  if (message.flaggedTerms.length === 0) {
    return [{ offset: 0, text: message.text, isFlagged: false }];
  }

  const segments: TranscriptSegment[] = [];
  let rest = message.text;
  let consumed = 0;

  while (rest.length > 0) {
    let matchIndex = -1;
    let matchTerm = '';
    for (const term of message.flaggedTerms) {
      const index = rest.indexOf(term);
      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
        matchTerm = term;
      }
    }

    if (matchIndex === -1) {
      segments.push({ offset: consumed, text: rest, isFlagged: false });
      break;
    }

    if (matchIndex > 0) {
      segments.push({ offset: consumed, text: rest.slice(0, matchIndex), isFlagged: false });
    }
    segments.push({ offset: consumed + matchIndex, text: matchTerm, isFlagged: true });
    rest = rest.slice(matchIndex + matchTerm.length);
    consumed += matchIndex + matchTerm.length;
  }

  return segments;
}
