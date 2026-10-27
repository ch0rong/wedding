import { CONFIG } from '../config.js?v=202610271558';
import { escapeHtml } from '../utils/dom.js?v=202610271558';

const ICON_CALL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const ICON_SMS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 10h8M8 13h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/** "아버지 · 어머니의 아들 서태평" — 혼주 이름이 없으면 "신랑 서태평" */
function familyLine(person, role) {
  const parents = [person.father, person.mother].filter(Boolean).map(escapeHtml).join(' · ');
  const name = `<b class="family__name">${escapeHtml(person.name)}</b>`;
  if (!parents) return `<p class="family__row"><span class="family__role">${role}</span> ${name}</p>`;
  return `<p class="family__row">${parents}<span class="family__rel">의 ${escapeHtml(person.relation)}</span> ${name}</p>`;
}

function contactCard(person, role) {
  const tel = (person.phone || '').replace(/[^0-9+]/g, '');
  if (!tel) return '';
  return `
    <div class="contact">
      <p class="contact__who">${role} <b>${escapeHtml(person.name)}</b></p>
      <div class="contact__btns">
        <a class="icon-btn" href="tel:${tel}" aria-label="${role}에게 전화하기">${ICON_CALL}</a>
        <a class="icon-btn" href="sms:${tel}" aria-label="${role}에게 문자하기">${ICON_SMS}</a>
      </div>
    </div>`;
}

/** Section 2: 모시는 글 + 혼주/신랑신부 + 연락하기 */
export function initGreeting(mount) {
  const { groom, bride, greeting } = CONFIG;
  const contacts = contactCard(groom, '신랑') + contactCard(bride, '신부');

  mount.innerHTML = `
    <p class="greeting">${greeting.map((l) => escapeHtml(l) || '&nbsp;').join('<br>')}</p>
    <div class="family">
      ${familyLine(groom, '신랑')}
      ${familyLine(bride, '신부')}
    </div>
    ${contacts ? `<div class="contacts">${contacts}</div>` : ''}`;
}
