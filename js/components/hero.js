import { CONFIG } from '../config.js?v=202610271558';
import { escapeHtml } from '../utils/dom.js?v=202610271558';
import { WEEKDAYS_EN, dotDate, timeEn, weddingWeekday } from '../utils/date.js?v=202610271558';

/** Section 1: 메인 사진을 위/왼쪽/오른쪽 손글씨 텍스트가 감싸는 프레임 */
export function initHero(mount) {
  const groom = escapeHtml(CONFIG.groom.name);
  const bride = escapeHtml(CONFIG.bride.name);

  mount.innerHTML = `
    <figure class="hero">
      <div class="hero__frame">
        <img class="hero__photo" src="${escapeHtml(CONFIG.mainPhoto)}" alt="${groom}, ${bride}의 웨딩 사진" fetchpriority="high">
        <h1 class="hero__text hero__text--top">${groom} <span class="hero__heart">♥</span> ${bride}</h1>
        <p class="hero__text hero__text--left">Save the date! ${dotDate('. ')}</p>
        <p class="hero__text hero__text--right">${WEEKDAYS_EN[weddingWeekday()]}, ${timeEn()}</p>
      </div>
    </figure>`;
}
