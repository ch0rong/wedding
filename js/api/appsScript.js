/**
 * Google Apps Script 웹앱 공통 통신 (계좌 + 방명록).
 * 응답 형식: { ok: true, data } | { ok: false, error }
 *
 * POST는 Content-Type을 text/plain으로 보내야 CORS preflight 없이 Apps Script에 도달한다.
 */
import { CONFIG } from '../config.js?v=202610271551';

export const hasAppsScript = Boolean(CONFIG.appsScriptUrl);

async function unwrap(res) {
  if (!res.ok) throw new Error(`서버와 연결할 수 없습니다. (${res.status})`);
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || '요청을 처리하지 못했습니다.');
  return body.data;
}

export async function gasGet(params) {
  const url = new URL(CONFIG.appsScriptUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  return unwrap(await fetch(url));
}

export async function gasPost(body) {
  return unwrap(await fetch(CONFIG.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  }));
}
