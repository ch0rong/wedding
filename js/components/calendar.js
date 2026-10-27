import { CONFIG } from '../config.js';
import { escapeHtml } from '../utils/dom.js';
import { WEEKDAYS, dayDiffKST, timeKo, weekdayOf } from '../utils/date.js';

function gridHtml() {
  const { year, month, day } = CONFIG.wedding;
  const first = weekdayOf(year, month, 1);
  const lastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = WEEKDAYS.map((w, i) =>
    `<span class="cal__head${i === 0 ? ' is-sun' : ''}">${w}</span>`);
  for (let i = 0; i < first; i++) cells.push('<span></span>');
  for (let d = 1; d <= lastDate; d++) {
    const wd = (first + d - 1) % 7;
    const cls = ['cal__day', wd === 0 && 'is-sun', d === day && 'is-wedding'].filter(Boolean).join(' ');
    cells.push(`<span class="${cls}"${d === day ? ' aria-label="결혼식 날"' : ''}>${d}</span>`);
  }
  return cells.join('');
}

function ddayHtml() {
  const diff = dayDiffKST();
  const couple = `${escapeHtml(CONFIG.groom.name)} <span class="heart">♥</span> ${escapeHtml(CONFIG.bride.name)}`;
  if (diff > 0) return `${couple}의 결혼식이 <b>${diff}일</b> 남았습니다.`;
  if (diff === 0) return `오늘은 ${couple}의 <b>결혼식 날</b>입니다.`;
  return `${couple}, 결혼한 지 <b>${-diff}일</b>째입니다.`;
}

/** Section 3: 달력 + D-Day */
export function initCalendar(mount) {
  const { year, month, day } = CONFIG.wedding;
  mount.innerHTML = `
    <p class="cal__date">${year}년 ${month}월 ${day}일 ${WEEKDAYS[weekdayOf(year, month, day)]}요일 ${timeKo()}</p>
    <div class="cal" aria-label="${year}년 ${month}월 달력">
      <p class="cal__month">${month}월</p>
      <div class="cal__grid">${gridHtml()}</div>
    </div>
    <p class="dday">${ddayHtml()}</p>`;
}
