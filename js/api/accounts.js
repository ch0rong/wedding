/**
 * 계좌 정보 조회. 계좌는 소스코드에 없고 Google Apps Script(스크립트 속성)에서 받아온다.
 * Apps Script에 ACCESS_KEY를 설정했다면 청첩장 링크의 ?key= 값이 함께 전달되어야 한다.
 * 응답 형식: { ok: true, data } | { ok: false, error }
 */
import { CONFIG } from '../config.js';
import { mockApi } from './mock.js';

export const isAccountsDemo = !CONFIG.accountsApiUrl;

export async function getAccounts() {
  if (isAccountsDemo) return mockApi.getAccounts();

  const url = new URL(CONFIG.accountsApiUrl);
  url.searchParams.set('action', 'accounts');
  const key = new URLSearchParams(location.search).get('key');
  if (key) url.searchParams.set('key', key);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`서버와 연결할 수 없습니다. (${res.status})`);
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || '계좌 정보를 불러오지 못했습니다.');
  return body.data;
}
