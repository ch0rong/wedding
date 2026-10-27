/**
 * 방명록 API (Google Apps Script + 구글 스프레드시트).
 *
 * 비밀번호는 Apps Script에서 솔트 + SHA-256 해시로만 저장/검증하고,
 * 해시는 응답에 포함되지 않는다. 같은 글에 5번 틀리면 10분간 잠긴다.
 *
 * CONFIG.appsScriptUrl이 비어 있으면 mock(localStorage)으로 동작한다.
 */
import { gasGet, gasPost, hasAppsScript } from './appsScript.js?v=202610271551';
import { mockApi } from './mock.js?v=202610271551';

export const isGuestbookDemo = !hasAppsScript;

const remote = {
  list: (page = 1, size = 10) => gasGet({ action: 'list', page, size }),
  create: ({ name, password, message }) => gasPost({ action: 'create', name, password, message }),
  update: ({ id, password, message }) => gasPost({ action: 'update', id, password, message }),
  remove: ({ id, password }) => gasPost({ action: 'delete', id, password }),
};

const demo = {
  list: mockApi.listGuestbook,
  create: mockApi.createGuestbook,
  update: mockApi.updateGuestbook,
  remove: mockApi.deleteGuestbook,
};

export const guestbookApi = isGuestbookDemo ? demo : remote;
