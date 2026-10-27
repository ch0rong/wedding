import { escapeHtml } from './dom.js?v=202610271540';

/**
 * 간단한 확인용 모달.
 * onConfirm(form)이 예외를 던지면 모달을 닫지 않고 오류 문구를 보여준다.
 * @returns {Promise<any>} onConfirm의 반환값, 취소 시 null
 */
export function openModal({ title, body = '', confirmText = '확인', danger = false, onConfirm }) {
  const root = document.getElementById('modal');
  const lastFocus = document.activeElement;

  root.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <form class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" novalidate>
      <h2 class="modal__title" id="modal-title">${escapeHtml(title)}</h2>
      <div class="modal__body">${body}</div>
      <p class="modal__error" role="alert"></p>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>취소</button>
        <button type="submit" class="btn ${danger ? 'btn--danger' : 'btn--primary'}">${escapeHtml(confirmText)}</button>
      </div>
    </form>`;
  root.hidden = false;
  requestAnimationFrame(() => root.classList.add('is-open'));

  const form = root.querySelector('form');
  const errorEl = root.querySelector('.modal__error');
  const submitBtn = form.querySelector('[type=submit]');
  (form.querySelector('input, textarea') || submitBtn).focus();

  return new Promise((resolve) => {
    function close(result) {
      root.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        root.hidden = true;
        root.innerHTML = '';
        lastFocus?.focus?.();
      }, 200);
      resolve(result);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(null);
    }
    document.addEventListener('keydown', onKey);
    root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => close(null)));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      submitBtn.disabled = true;
      try {
        close(await onConfirm(form));
      } catch (err) {
        errorEl.textContent = err.message;
        submitBtn.disabled = false;
      }
    });
  });
}
