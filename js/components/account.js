import { getAccounts, isAccountsDemo } from '../api/accounts.js?v=202610271551';
import { copyText, escapeHtml } from '../utils/dom.js?v=202610271551';

const GROUPS = [
  { key: 'groom', label: '신랑측 계좌번호' },
  { key: 'bride', label: '신부측 계좌번호' },
];
const CHEVRON = '<svg class="accordion__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function accountRow(acc) {
  const number = escapeHtml(acc.number);
  const pay = /^https:\/\//.test(acc.kakaopay || '')
    ? `<a class="btn btn--kakaopay btn--sm" href="${escapeHtml(acc.kakaopay)}" target="_blank" rel="noopener">카카오페이</a>`
    : '';
  return `
    <li class="acc">
      <div class="acc__info">
        <p class="acc__who"><span class="acc__role">${escapeHtml(acc.role)}</span>${escapeHtml(acc.name)}</p>
        <p class="acc__num">${escapeHtml(acc.bank)} ${number}</p>
      </div>
      <div class="acc__actions">
        <button type="button" class="btn btn--line btn--sm" data-copy="${number}">복사하기</button>
        ${pay}
      </div>
    </li>`;
}

function accordionHtml(data) {
  return GROUPS.map(({ key, label }) => {
    const list = data[key] || [];
    if (!list.length) return '';
    return `
      <div class="accordion" data-open="false">
        <h3 class="accordion__head">
          <button type="button" class="accordion__btn" aria-expanded="false" aria-controls="acc-${key}" id="acc-btn-${key}">
            ${label}${CHEVRON}
          </button>
        </h3>
        <div class="accordion__panel" id="acc-${key}" role="region" aria-labelledby="acc-btn-${key}">
          <ul class="accordion__inner">${list.map(accountRow).join('')}</ul>
        </div>
      </div>`;
  }).join('');
}

async function load(slot) {
  slot.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  try {
    slot.innerHTML = accordionHtml(await getAccounts()) || '<p class="empty">등록된 계좌 정보가 없습니다.</p>';
  } catch (err) {
    slot.innerHTML = `
      <div class="error-box">
        <p>${escapeHtml(err.message)}</p>
        <button type="button" class="btn btn--line btn--sm" data-retry>다시 시도</button>
      </div>`;
  }
}

/** Section 6: 마음 전하기 (계좌는 Apps Script에서 받아옴) */
export function initAccount(mount) {
  mount.innerHTML = `
    <p class="section-desc">
      참석이 어려우신 분들을 위해 계좌번호를 기재하였습니다.<br>
      너그러운 마음으로 양해 부탁드립니다.
    </p>
    ${isAccountsDemo ? '<p class="demo-badge">데모 · 실제 계좌가 아닙니다</p>' : ''}
    <div data-slot></div>`;

  const slot = mount.querySelector('[data-slot]');
  slot.addEventListener('click', (e) => {
    const toggle = e.target.closest('.accordion__btn');
    if (toggle) {
      const acc = toggle.closest('.accordion');
      const open = acc.dataset.open !== 'true';
      acc.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
      return;
    }
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) return void copyText(copyBtn.dataset.copy, '계좌번호가 복사되었습니다.');
    if (e.target.closest('[data-retry]')) load(slot);
  });

  load(slot);
}
