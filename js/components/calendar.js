import { CONFIG } from '../config.js?v=202610271540';
import { escapeHtml } from '../utils/dom.js?v=202610271540';
import { WEEKDAYS, dayDiffKST, timeKo, weekdayOf, weddingInstant } from '../utils/date.js?v=202610271540';

function gridHtml() {
  const { year, month, day } = CONFIG.wedding;
  const holidays = CONFIG.holidays || [];
  const first = weekdayOf(year, month, 1);
  const lastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = WEEKDAYS.map((w, i) =>
    `<span class="cal__head${i === 0 ? ' is-holiday' : i === 6 ? ' is-sat' : ''}">${w}</span>`);
  for (let i = 0; i < first; i++) cells.push('<span></span>');
  for (let d = 1; d <= lastDate; d++) {
    const wd = (first + d - 1) % 7;
    const cls = ['cal__day'];
    if (wd === 0 || holidays.includes(d)) cls.push('is-holiday');
    else if (wd === 6) cls.push('is-sat');
    if (d === day) cls.push('is-wedding');
    cells.push(d === day
      ? `<span class="${cls.join(' ')}" aria-label="결혼식 날"><i class="cal__heart" aria-hidden="true"></i><b>${d}</b></span>`
      : `<span class="${cls.join(' ')}">${d}</span>`);
  }
  return cells.join('');
}

function ddayHtml() {
  const diff = dayDiffKST();
  const couple = `${escapeHtml(CONFIG.groom.name)} <span class="heart">♥</span> ${escapeHtml(CONFIG.bride.name)}`;
  if (diff > 0) return `${couple}의 결혼식이 <b>${diff}</b>일 남았습니다.`;
  if (diff === 0) return `오늘은 ${couple}의 <b>결혼식 날</b>입니다.`;
  return `${couple}의 결혼식이 <b>${-diff}</b>일 지났습니다.`;
}

/** 예식 시각까지 남은 일·시·분·초 (1초마다 갱신) */
function startCountdown(root) {
  const target = weddingInstant();
  const slots = ['d', 'h', 'm', 's'].map((k) => root.querySelector(`[data-cd=${k}]`));
  const tick = () => {
    const sec = Math.floor(Math.abs(target - Date.now()) / 1000);
    [Math.floor(sec / 86400), Math.floor(sec / 3600) % 24, Math.floor(sec / 60) % 60, sec % 60]
      .forEach((v, i) => { slots[i].textContent = v; });
  };
  tick();
  setInterval(tick, 1000);
}

/** Section 3: 달력 + 카운트다운 + D-Day */
export function initCalendar(mount) {
  const { year, month, day } = CONFIG.wedding;
  mount.innerHTML = `
    <p class="cal__date">${year}년 ${month}월 ${day}일 ${WEEKDAYS[weekdayOf(year, month, day)]}요일 ${timeKo()}</p>
    <div class="cal" aria-label="${year}년 ${month}월 달력">
      <div class="cal__grid">${gridHtml()}</div>
    </div>
    <div class="countdown" role="timer">
      <div><span data-cd="d">0</span><small>DAY</small></div><i>:</i>
      <div><span data-cd="h">0</span><small>HOUR</small></div><i>:</i>
      <div><span data-cd="m">0</span><small>MIN</small></div><i>:</i>
      <div><span data-cd="s">0</span><small>SEC</small></div>
    </div>
    <p class="dday">${ddayHtml()}</p>`;

  startCountdown(mount);
}
