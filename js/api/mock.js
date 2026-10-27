/**
 * Apps Script 배포 전 로컬 확인용 가짜 API.
 * 데이터는 현재 브라우저의 localStorage에만 저장된다. 실제 계좌 정보를 넣지 말 것.
 */
const STORE_KEY = 'wedding-guestbook-demo';
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}
function save(items) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
  } catch { /* 저장 불가 환경(사생활 보호 모드 등)은 무시 */ }
}
const publicView = ({ password, ...rest }) => rest;

function findWithPassword(items, id, password) {
  const item = items.find((it) => it.id === id);
  if (!item) throw new Error('글을 찾을 수 없습니다.');
  if (item.password !== password) throw new Error('비밀번호가 일치하지 않습니다.');
  return item;
}

export const mockApi = {
  async getAccounts() {
    await delay();
    return {
      groom: [
        { role: '신랑', name: '데모 예금주', bank: '데모은행', number: '000-0000-0000-00' },
        { role: '신랑 아버지', name: '데모 예금주', bank: '데모은행', number: '111-1111-1111-11' },
      ],
      bride: [
        { role: '신부', name: '데모 예금주', bank: '데모은행', number: '222-2222-2222-22' },
      ],
    };
  },

  async listGuestbook(page = 1, size = 10) {
    await delay();
    const items = load();
    const start = (page - 1) * size;
    return {
      items: items.slice(start, start + size).map(publicView),
      total: items.length,
      hasMore: start + size < items.length,
    };
  },

  async createGuestbook({ name, password, message }) {
    await delay();
    const now = new Date().toISOString();
    const item = { id: crypto.randomUUID?.() ?? String(Date.now()), name, password, message, createdAt: now, updatedAt: now };
    save([item, ...load()]);
    return publicView(item);
  },

  async updateGuestbook({ id, password, message }) {
    await delay();
    const items = load();
    const item = findWithPassword(items, id, password);
    item.message = message;
    item.updatedAt = new Date().toISOString();
    save(items);
    return publicView(item);
  },

  async deleteGuestbook({ id, password }) {
    await delay();
    const items = load();
    findWithPassword(items, id, password);
    save(items.filter((it) => it.id !== id));
    return { id };
  },
};
