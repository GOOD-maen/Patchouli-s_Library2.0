/**
 * 格式化消息时间
 * - 1分钟内：刚刚
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 前天：前天 HH:mm
 * - 更早：YYYY年MM月DD日
 */
export function formatMessageTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // 1分钟内：刚刚
  if (diffMinutes < 1) {
    return '刚刚';
  }

  // 判断是否是同一天
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  // 今天
  if (isSameDay(now, date)) {
    return timeStr;
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(yesterday, date)) {
    return `昨天 ${timeStr}`;
  }

  // 前天
  const dayBeforeYesterday = new Date(now);
  dayBeforeYesterday.setDate(now.getDate() - 2);
  if (isSameDay(dayBeforeYesterday, date)) {
    return `前天 ${timeStr}`;
  }

  // 更早
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}