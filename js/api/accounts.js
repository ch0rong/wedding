/**
 * 계좌 정보 조회. 계좌는 소스코드에 없고 Google Apps Script(스크립트 속성)에서 받아온다.
 * Apps Script에 ACCESS_KEY를 설정했다면 청첩장 링크의 ?key= 값이 함께 전달되어야 한다.
 */
import { gasGet, hasAppsScript } from './appsScript.js?v=202610271551';
import { mockApi } from './mock.js?v=202610271551';

export const isAccountsDemo = !hasAppsScript;

export function getAccounts() {
  if (isAccountsDemo) return mockApi.getAccounts();
  const key = new URLSearchParams(location.search).get('key');
  return gasGet({ action: 'accounts', key });
}
