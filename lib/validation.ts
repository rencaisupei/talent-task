/**
 * 註冊與實名認證（KYC）用的欄位驗證工具。
 * 這裡只做格式與檢核碼判斷，正式版仍需由後端與人工／第三方驗證服務再確認一次。
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** 信箱一律小寫並去除頭尾空白，避免同一個信箱重複註冊。 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export const PASSWORD_MIN_LENGTH = 8;

/** 回傳密碼不合格的原因，合格時回傳 null。 */
export function passwordIssue(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) return `密碼至少要 ${PASSWORD_MIN_LENGTH} 個字元`;
  if (!/[A-Za-z]/.test(value)) return '密碼需要包含英文字母';
  if (!/\d/.test(value)) return '密碼需要包含數字';
  if (/\s/.test(value)) return '密碼不能包含空白';
  return null;
}

/** 密碼強度指標，用來顯示提示條。 */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  if (value.length === 0) return 0;
  let score = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1;
  if (value.length >= 12 || /[^A-Za-z0-9]/.test(value)) score += 1;
  if (score >= 3) return 3;
  if (score === 2) return 2;
  if (score === 1) return 1;
  return 0;
}

/** 把信箱遮罩成 ab***@example.com，用在畫面上顯示。 */
export function maskEmail(value: string): string {
  const email = normalizeEmail(value);
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const name = email.slice(0, at);
  const domain = email.slice(at);
  if (name.length <= 2) return `${name[0] ?? ''}***${domain}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.min(name.length - 2, 4))}${domain}`;
}

/** 中華民國身分證字母對應的兩位數字。 */
const LETTER_CODE: Record<string, number> = {
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
  G: 16,
  H: 17,
  I: 34,
  J: 18,
  K: 19,
  L: 20,
  M: 21,
  N: 22,
  O: 35,
  P: 23,
  Q: 24,
  R: 25,
  S: 26,
  T: 27,
  U: 28,
  V: 29,
  W: 32,
  X: 30,
  Y: 31,
  Z: 33,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 1];

/** 身分證／居留證共用的檢核碼運算。digits 需為 9 位數字。 */
function passesChecksum(letter: string, digits: number[]): boolean {
  const code = LETTER_CODE[letter];
  if (code === undefined || digits.length !== 9) return false;
  let sum = Math.floor(code / 10) + (code % 10) * 9;
  for (let index = 0; index < WEIGHTS.length; index += 1) {
    sum += (digits[index] ?? 0) * (WEIGHTS[index] ?? 0);
  }
  sum += digits[8] ?? 0;
  return sum % 10 === 0;
}

export function normalizeIdNumber(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

/** 國民身分證：1 個英文字母 + 性別碼 1／2 + 8 位數字，並通過檢核碼。 */
export function isValidNationalId(value: string): boolean {
  const id = normalizeIdNumber(value);
  if (!/^[A-Z][12]\d{8}$/.test(id)) return false;
  return passesChecksum(id[0] ?? '', Array.from(id.slice(1), Number));
}

/** 居留證：新式（字母 + 8／9 + 8 位數字）或舊式（兩個字母 + 8 位數字）。 */
export function isValidResidentId(value: string): boolean {
  const id = normalizeIdNumber(value);
  if (/^[A-Z][89]\d{8}$/.test(id)) {
    return passesChecksum(id[0] ?? '', Array.from(id.slice(1), Number));
  }
  if (/^[A-Z][A-D]\d{8}$/.test(id)) {
    const second = LETTER_CODE[id[1] ?? ''];
    if (second === undefined) return false;
    return passesChecksum(id[0] ?? '', [second % 10, ...Array.from(id.slice(2), Number)]);
  }
  return false;
}

/** 護照號碼：6–12 位英數字。 */
export function isValidPassportNumber(value: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(normalizeIdNumber(value));
}

/** 遮罩證件號碼，只留頭尾。 */
export function maskIdNumber(value: string): string {
  const id = normalizeIdNumber(value);
  if (id.length <= 4) return id;
  return `${id.slice(0, 3)}${'*'.repeat(Math.max(id.length - 5, 1))}${id.slice(-2)}`;
}

/** 把使用者輸入的數字整理成 YYYY-MM-DD 的形狀。 */
export function formatBirthInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

/** 解析 YYYY-MM-DD，日期不存在時回傳 null。 */
export function parseBirthDate(value: string): BirthDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

/** 依出生日期算足歲。 */
export function ageFromBirthDate(birth: BirthDate, now = new Date()): number {
  let age = now.getFullYear() - birth.year;
  const beforeBirthday =
    now.getMonth() + 1 < birth.month ||
    (now.getMonth() + 1 === birth.month && now.getDate() < birth.day);
  if (beforeBirthday) age -= 1;
  return age;
}

export const MIN_AGE = 18;

/** 回傳出生日期不合格的原因，合格時回傳 null。 */
export function birthDateIssue(value: string): string | null {
  const parsed = parseBirthDate(value);
  if (!parsed) return '請輸入正確的出生年月日（例如 1996-05-08）';
  const age = ageFromBirthDate(parsed);
  if (age < MIN_AGE) return `JiMatch 只對 ${MIN_AGE} 歲以上開放`;
  if (age > 100) return '請確認出生年份是否正確';
  return null;
}
