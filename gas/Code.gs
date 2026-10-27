/**
 * 모바일 청첩장 — 계좌 정보 API (Google Apps Script)
 *
 * 계좌번호/예금주를 공개 저장소에 두지 않기 위해, 스크립트 속성에 저장해 두고 여기서만 내려준다.
 *
 * [스크립트 속성] 프로젝트 설정(⚙) > 스크립트 속성
 *   ACCOUNTS   (필수) {"groom":[{"role":"신랑","name":"서태평","bank":"OO은행","number":"000-0000-0000","kakaopay":""}],"bride":[...]}
 *   ACCESS_KEY (선택) 설정하면 청첩장 링크에 ?key=값 이 있어야만 계좌가 조회됨
 *
 * 응답 형식: { ok: true, data } | { ok: false, error }
 */

function doGet(e) {
  let out;
  try {
    const p = (e && e.parameter) || {};
    if (p.action !== 'accounts') fail_('알 수 없는 요청입니다.');
    out = { ok: true, data: getAccounts_(p.key) };
  } catch (err) {
    console.error(err);
    out = { ok: false, error: err.userFacing ? err.message : '일시적인 오류가 발생했습니다.' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function getAccounts_(key) {
  const props = PropertiesService.getScriptProperties();
  const accessKey = props.getProperty('ACCESS_KEY');
  if (accessKey && key !== accessKey) {
    fail_('계좌 정보는 청첩장 링크로 접속하셔야 확인할 수 있습니다.');
  }
  const raw = props.getProperty('ACCOUNTS');
  if (!raw) return { groom: [], bride: [] };
  return JSON.parse(raw);
}

/** 사용자에게 그대로 보여줄 오류 */
function fail_(message) {
  const err = new Error(message);
  err.userFacing = true;
  throw err;
}

/** 편집기에서 ▶ 실행해 설정 확인용 */
function checkSetup() {
  const props = PropertiesService.getScriptProperties();
  Logger.log('ACCOUNTS 설정됨: ' + Boolean(props.getProperty('ACCOUNTS')));
  Logger.log('ACCESS_KEY 설정됨: ' + Boolean(props.getProperty('ACCESS_KEY')));
  Logger.log(JSON.stringify(getAccounts_(props.getProperty('ACCESS_KEY'))));
}
