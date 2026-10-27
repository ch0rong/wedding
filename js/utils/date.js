import { CONFIG } from '../config.js?v=202610271558';
import { pad2 } from './dom.js?v=202610271558';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 86_400_000;

export function weekdayOf(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** 예식 시각 (한국 시간 기준 절대 시각, ms) */
export function weddingInstant() {
  const { year, month, day, hour, minute } = CONFIG.wedding;
  return Date.UTC(year, month - 1, day, hour - 9, minute);
}

/** 예식 요일 인덱스 (0=일) */
export function weddingWeekday() {
  const { year, month, day } = CONFIG.wedding;
  return weekdayOf(year, month, day);
}

/** 보는 사람의 시간대와 상관없이 한국 날짜 기준으로 남은 일수 */
export function dayDiffKST() {
  const { year, month, day } = CONFIG.wedding;
  const kstNow = new Date(Date.now() + 9 * 3600_000);
  const today = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate());
  return Math.round((Date.UTC(year, month - 1, day) - today) / DAY_MS);
}

/** "2027.01.16" */
export function dotDate(sep = '.') {
  const { year, month, day } = CONFIG.wedding;
  return [year, pad2(month), pad2(day)].join(sep);
}

/** "오후 12시 30분" */
export function timeKo() {
  const { hour, minute } = CONFIG.wedding;
  return `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}시${minute ? ` ${minute}분` : ''}`;
}

/** "PM 12:30" */
export function timeEn() {
  const { hour, minute } = CONFIG.wedding;
  return `${hour < 12 ? 'AM' : 'PM'} ${hour % 12 || 12}:${pad2(minute)}`;
}
