const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(timestamp: number, now = Date.now()) {
  const diff = Math.max(0, now - timestamp);
  if (diff < MINUTE) return '剛剛';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分鐘前`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 小時前`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} 天前`;
  return formatDate(timestamp);
}

export function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatClock(timestamp: number) {
  const date = new Date(timestamp);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function activityLabel(online: boolean, lastActiveMinutes: number) {
  if (online) return '線上中';
  if (lastActiveMinutes < 60) return `${lastActiveMinutes} 分鐘前活躍`;
  if (lastActiveMinutes < 60 * 24) return `${Math.floor(lastActiveMinutes / 60)} 小時前活躍`;
  return `${Math.floor(lastActiveMinutes / (60 * 24))} 天前活躍`;
}

export function distanceLabel(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} 公尺內`;
  return `${distanceKm.toFixed(1)} 公里`;
}

export function messagePreview(kind: string, text?: string) {
  switch (kind) {
    case 'image':
      return '[照片]';
    case 'voice':
      return '[語音訊息]';
    case 'gift':
      return '[禮物]';
    case 'call':
      return '[通話]';
    default:
      return text ?? '';
  }
}
