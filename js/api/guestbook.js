/**
 * 방명록 API (Supabase).
 *
 * 비밀번호 해시가 브라우저에 노출되지 않도록 테이블에 직접 접근하지 않고,
 * supabase/schema.sql에 정의한 RPC 함수(security definer)로만 읽고 쓴다.
 * 함수 안에서 bcrypt로 비밀번호를 검증하므로 남의 글을 수정/삭제할 수 없다.
 *
 * CONFIG.supabase가 비어 있으면 mock(localStorage)으로 동작한다.
 */
import { CONFIG } from '../config.js?v=202610271533';
import { mockApi } from './mock.js?v=202610271533';

const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

export const isGuestbookDemo = !(CONFIG.supabase.url && CONFIG.supabase.anonKey);

let clientPromise;
function client() {
  clientPromise ??= import(SUPABASE_JS).then(({ createClient }) =>
    createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
      auth: { persistSession: false },
    }));
  return clientPromise;
}

async function rpc(fn, params) {
  const sb = await client();
  const { data, error } = await sb.rpc(fn, params);
  if (error) {
    // SQL 함수에서 raise exception으로 던진 한국어 메시지는 그대로 보여준다
    throw new Error(error.message || '요청을 처리하지 못했습니다.');
  }
  // 비밀번호 불일치는 실패 횟수 기록이 롤백되지 않도록 예외 대신 { error }로 돌아온다
  if (data && data.error) throw new Error(data.error);
  return data;
}

const remote = {
  async list(page = 1, size = 10) {
    const { items, total } = await rpc('guestbook_list', { p_page: page, p_size: size });
    return { items, total, hasMore: page * size < total };
  },
  create: ({ name, password, message }) =>
    rpc('guestbook_create', { p_name: name, p_password: password, p_message: message }),
  update: ({ id, password, message }) =>
    rpc('guestbook_update', { p_id: id, p_password: password, p_message: message }),
  remove: ({ id, password }) =>
    rpc('guestbook_delete', { p_id: id, p_password: password }),
};

const demo = {
  list: mockApi.listGuestbook,
  create: mockApi.createGuestbook,
  update: mockApi.updateGuestbook,
  remove: mockApi.deleteGuestbook,
};

export const guestbookApi = isGuestbookDemo ? demo : remote;
