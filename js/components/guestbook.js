import { guestbookApi as api, isGuestbookDemo } from '../api/guestbook.js?v=202610271608';
import { escapeHtml, formatDateTime, toast } from '../utils/dom.js?v=202610271608';
import { openModal } from '../utils/modal.js?v=202610271608';

const PAGE_SIZE = 5;
// gas/Code.gs의 LIMITS와 같게 유지
const LIMITS = { name: 20, message: 500, pwMin: 4, pwMax: 20 };

function validate({ name, password, message }) {
  if (name !== undefined && !name) return '이름을 입력해 주세요.';
  if (password !== undefined && (password.length < LIMITS.pwMin || password.length > LIMITS.pwMax)) {
    return `비밀번호는 ${LIMITS.pwMin}~${LIMITS.pwMax}자로 입력해 주세요.`;
  }
  if (message !== undefined && !message) return '축하 메시지를 입력해 주세요.';
  return '';
}

function itemHtml(item) {
  const edited = item.updatedAt && item.updatedAt !== item.createdAt;
  return `
    <li class="gb-item" data-id="${escapeHtml(item.id)}">
      <p class="gb-item__msg">${escapeHtml(item.message)}</p>
      <div class="gb-item__foot">
        <span><b class="gb-item__name">${escapeHtml(item.name)}</b>
          <time class="gb-item__date" datetime="${escapeHtml(item.createdAt)}">${formatDateTime(item.createdAt)}${edited ? ' (수정됨)' : ''}</time></span>
        <span class="gb-item__actions">
          <button type="button" class="text-btn" data-act="edit">수정</button>
          <button type="button" class="text-btn" data-act="delete">삭제</button>
        </span>
      </div>
    </li>`;
}

const pwField = `
  <label class="field"><span class="field__label">비밀번호</span>
    <input name="password" type="password" maxlength="${LIMITS.pwMax}" autocomplete="current-password" required>
  </label>`;

/** Section 7: 방명록 (구글 스프레드시트) */
export function initGuestbook(mount) {
  mount.innerHTML = `
    ${isGuestbookDemo ? '<p class="demo-badge">데모 · 이 기기에만 저장됩니다</p>' : ''}
    <form class="gb-form" novalidate>
      <div class="gb-form__row">
        <label class="field">
          <span class="field__label">이름</span>
          <input name="name" maxlength="${LIMITS.name}" autocomplete="name" required>
        </label>
        <label class="field">
          <span class="field__label">비밀번호</span>
          <input name="password" type="password" maxlength="${LIMITS.pwMax}" autocomplete="new-password" placeholder="수정·삭제용" required>
        </label>
      </div>
      <label class="field">
        <span class="field__label">축하 메시지</span>
        <textarea name="message" rows="4" maxlength="${LIMITS.message}" placeholder="두 사람에게 축하의 말을 남겨 주세요" required></textarea>
      </label>
      <p class="form-error" role="alert"></p>
      <button type="submit" class="btn btn--primary btn--block">등록</button>
    </form>

    <ul class="gb-list" data-list></ul>
    <p class="empty" data-empty hidden>첫 번째 축하 메시지를 남겨 주세요.</p>
    <button type="button" class="btn btn--line btn--block" data-more hidden>더보기</button>`;

  const form = mount.querySelector('.gb-form');
  const formError = form.querySelector('.form-error');
  const submitBtn = form.querySelector('[type=submit]');
  const list = mount.querySelector('[data-list]');
  const emptyEl = mount.querySelector('[data-empty]');
  const moreBtn = mount.querySelector('[data-more]');
  const state = { page: 0, items: new Map() };

  const renderEmpty = () => { emptyEl.hidden = state.items.size > 0; };

  async function loadMore() {
    moreBtn.disabled = true;
    try {
      const { items, hasMore } = await api.list(state.page + 1, PAGE_SIZE);
      state.page += 1;
      // 그사이 새 글이 생겨 페이지가 밀리면 중복될 수 있으므로 걸러낸다
      const fresh = items.filter((it) => !state.items.has(it.id));
      fresh.forEach((it) => state.items.set(it.id, it));
      list.insertAdjacentHTML('beforeend', fresh.map(itemHtml).join(''));
      moreBtn.hidden = !hasMore;
    } catch (err) {
      toast(err.message);
    } finally {
      moreBtn.disabled = false;
      renderEmpty();
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const payload = { name: f.name.value.trim(), password: f.password.value, message: f.message.value.trim() };
    formError.textContent = validate(payload);
    if (formError.textContent) return;

    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중…';
    try {
      const item = await api.create(payload);
      state.items.set(item.id, item);
      list.insertAdjacentHTML('afterbegin', itemHtml(item));
      form.reset();
      renderEmpty();
      toast('축하 메시지가 등록되었습니다. 감사합니다!');
    } catch (err) {
      formError.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '등록';
    }
  });

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const li = btn.closest('.gb-item');
    const item = state.items.get(li.dataset.id);
    if (!item) return;

    if (btn.dataset.act === 'edit') {
      const updated = await openModal({
        title: '메시지 수정',
        confirmText: '수정하기',
        body: `${pwField}
          <label class="field"><span class="field__label">메시지</span>
            <textarea name="message" rows="4" maxlength="${LIMITS.message}">${escapeHtml(item.message)}</textarea>
          </label>`,
        onConfirm: (f) => {
          const payload = { id: item.id, password: f.elements.password.value, message: f.elements.message.value.trim() };
          const error = validate(payload);
          if (error) throw new Error(error);
          return api.update(payload);
        },
      });
      if (updated) {
        state.items.set(updated.id, updated);
        li.outerHTML = itemHtml(updated);
        toast('수정되었습니다.');
      }
      return;
    }

    const removed = await openModal({
      title: '메시지 삭제',
      confirmText: '삭제하기',
      danger: true,
      body: `<p class="modal__text">작성할 때 입력한 비밀번호를 입력해 주세요.</p>${pwField}`,
      onConfirm: (f) => {
        if (!f.elements.password.value) throw new Error('비밀번호를 입력해 주세요.');
        return api.remove({ id: item.id, password: f.elements.password.value });
      },
    });
    if (removed) {
      state.items.delete(item.id);
      li.remove();
      renderEmpty();
      toast('삭제되었습니다.');
    }
  });

  moreBtn.addEventListener('click', loadMore);
  loadMore();
}
