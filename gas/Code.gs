/**
 * 모바일 청첩장 백엔드 (Google Apps Script)
 *
 * 1) 계좌 정보  : 스크립트 속성 ACCOUNTS(JSON)에서 읽어 반환 → 공개 저장소에 계좌가 남지 않음
 * 2) 방명록 CRUD : 구글 스프레드시트에 저장. 비밀번호는 솔트 + SHA-256 해시로만 저장
 *
 * [처음 한 번]
 *   편집기에서 setup 함수 선택 → ▶ 실행 → 권한 허용
 *   → 내 구글 드라이브에 '청첩장 방명록' 스프레드시트가 만들어지고, 주소가 실행 로그에 나옴
 *
 * [스크립트 속성] 프로젝트 설정(⚙) > 스크립트 속성
 *   ACCOUNTS           (필수) {"groom":[{"role":"신랑","name":"…","bank":"…","number":"…"}],"bride":[…]}
 *   ACCESS_KEY         (선택) 설정하면 청첩장 링크에 ?key=값 이 있어야만 계좌가 조회됨
 *   GUESTBOOK_SHEET_ID (자동) setup이 채움. 다른 시트를 쓰려면 그 시트 주소의 /d/와 /edit 사이 값
 *
 * [코드를 고친 뒤] 배포 > 배포 관리 > ✏ 편집 > 버전: 새 버전 > 배포 (URL은 그대로 유지됨)
 *
 * 응답 형식: { ok: true, data } | { ok: false, error }
 */

const SHEET_NAME = '방명록';
const HEADERS = ['id', '이름', '메시지', '작성 시간', '수정 시간', 'salt', 'hash', '삭제됨'];
const COL = { id: 0, name: 1, message: 2, createdAt: 3, updatedAt: 4, salt: 5, hash: 6, deleted: 7 };

// 청첩장(js/components/guestbook.js)의 LIMITS와 같은 값으로 유지
const LIMITS = { name: 20, message: 500, pwMin: 4, pwMax: 20, pageSize: 30 };
const MAX_PW_FAILS = 5;          // 같은 글에 비밀번호를 연속으로 틀릴 수 있는 횟수
const PW_LOCK_SECONDS = 10 * 60; // 초과 시 잠금 시간

/* =========================================================
   Entry points
   ========================================================= */
function doGet(e) {
  return respond_(() => {
    const p = (e && e.parameter) || {};
    switch (p.action) {
      case 'accounts':
        return getAccounts_(p.key);
      case 'list':
        return listEntries_(Number(p.page) || 1, Number(p.size) || 10);
      default:
        fail_('알 수 없는 요청입니다.');
    }
  });
}

function doPost(e) {
  return respond_(() => {
    let body;
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (err) {
      fail_('잘못된 요청 형식입니다.');
    }
    switch (body.action) {
      case 'create':
        return withLock_(() => createEntry_(body));
      case 'update':
        return withLock_(() => updateEntry_(body));
      case 'delete':
        return withLock_(() => deleteEntry_(body));
      default:
        fail_('알 수 없는 요청입니다.');
    }
  });
}

/* =========================================================
   계좌 정보
   ========================================================= */
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

/* =========================================================
   방명록
   ========================================================= */
function listEntries_(page, size) {
  size = Math.min(Math.max(1, size), LIMITS.pageSize);
  page = Math.max(1, page);

  const rows = readRows_()
    .filter((r) => r[COL.id] && r[COL.deleted] !== true)
    .reverse(); // 최신 글 먼저

  const start = (page - 1) * size;
  return {
    items: rows.slice(start, start + size).map(toPublic_),
    total: rows.length,
    hasMore: start + size < rows.length,
  };
}

function createEntry_(body) {
  const name = cleanText_(body.name, LIMITS.name, '이름');
  const message = cleanText_(body.message, LIMITS.message, '메시지');
  const password = checkPassword_(body.password);

  const now = new Date();
  const salt = Utilities.getUuid();
  const row = [];
  row[COL.id] = Utilities.getUuid();
  row[COL.name] = name;
  row[COL.message] = message;
  row[COL.createdAt] = now;
  row[COL.updatedAt] = now;
  row[COL.salt] = salt;
  row[COL.hash] = hash_(password, salt);
  row[COL.deleted] = false;

  getSheet_().appendRow(row.map(guardFormula_));
  return toPublic_(row);
}

function updateEntry_(body) {
  const message = cleanText_(body.message, LIMITS.message, '메시지');
  const found = findAndVerify_(body.id, body.password);
  const sheet = getSheet_();
  const now = new Date();
  sheet.getRange(found.rowNumber, COL.message + 1).setValue(guardFormula_(message));
  sheet.getRange(found.rowNumber, COL.updatedAt + 1).setValue(now);

  found.row[COL.message] = message;
  found.row[COL.updatedAt] = now;
  return toPublic_(found.row);
}

function deleteEntry_(body) {
  const found = findAndVerify_(body.id, body.password);
  // 실수 대비 행은 남겨두고 '삭제됨'만 표시 (시트에서 TRUE → FALSE로 바꾸면 복구)
  getSheet_().getRange(found.rowNumber, COL.deleted + 1).setValue(true);
  return { id: found.row[COL.id] };
}

/** id로 행을 찾고 비밀번호를 확인. 연속 실패 시 일정 시간 잠금 */
function findAndVerify_(id, password) {
  if (!id || typeof id !== 'string') fail_('잘못된 요청입니다.');
  if (!password || typeof password !== 'string') fail_('비밀번호를 입력해 주세요.');

  const cache = CacheService.getScriptCache();
  const failKey = 'pwfail_' + id;
  const fails = Number(cache.get(failKey)) || 0;
  if (fails >= MAX_PW_FAILS) fail_('비밀번호를 여러 번 틀렸습니다. 10분 후 다시 시도해 주세요.');

  const rows = readRows_();
  const index = rows.findIndex((r) => r[COL.id] === id && r[COL.deleted] !== true);
  if (index === -1) fail_('글을 찾을 수 없습니다. 이미 삭제되었을 수 있어요.');

  const row = rows[index];
  if (hash_(password, row[COL.salt]) !== row[COL.hash]) {
    cache.put(failKey, String(fails + 1), PW_LOCK_SECONDS);
    fail_('비밀번호가 일치하지 않습니다.');
  }
  cache.remove(failKey);
  return { row: row, rowNumber: index + 2 }; // 머리글 1행 + 0-based 보정
}

/* =========================================================
   Helpers
   ========================================================= */
function getSpreadsheet_() {
  // 시트에서 [확장 프로그램 > Apps Script]로 만든 경우엔 그 시트를, 아니면 GUESTBOOK_SHEET_ID 사용
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const id = PropertiesService.getScriptProperties().getProperty('GUESTBOOK_SHEET_ID');
  if (!id) fail_('방명록 시트가 아직 준비되지 않았습니다. (Apps Script에서 setup 실행 필요)');
  return SpreadsheetApp.openById(id);
}

function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    // id·이름·메시지·salt·hash 를 '일반 텍스트'로: "1234"→숫자, "1/16"→날짜 같은 자동 변환 방지
    sheet.getRange('A:C').setNumberFormat('@');
    sheet.getRange('F:G').setNumberFormat('@');
    sheet.getRange('D:E').setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.setColumnWidth(COL.message + 1, 360);
    sheet.hideColumns(COL.salt + 1, 2); // salt, hash는 숨김
  }
  return sheet;
}

function readRows_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
}

function toPublic_(row) {
  // salt/hash는 절대 내보내지 않는다
  return {
    id: String(row[COL.id]),
    name: unguardFormula_(row[COL.name]),
    message: unguardFormula_(row[COL.message]),
    createdAt: toIso_(row[COL.createdAt]),
    updatedAt: toIso_(row[COL.updatedAt]),
  };
}

function cleanText_(value, max, label) {
  const text = String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // 줄바꿈 외 제어문자 제거
    .trim();
  if (!text) fail_(label + '을(를) 입력해 주세요.');
  if (text.length > max) fail_(label + '은(는) ' + max + '자 이내로 입력해 주세요.');
  return text;
}

function checkPassword_(pw) {
  if (typeof pw !== 'string' || pw.length < LIMITS.pwMin || pw.length > LIMITS.pwMax) {
    fail_('비밀번호는 ' + LIMITS.pwMin + '~' + LIMITS.pwMax + '자로 입력해 주세요.');
  }
  return pw;
}

function hash_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  // hex 문자열 (base64는 '+'로 시작할 수 있어 시트에서 수식으로 오인될 수 있음)
  return bytes.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}

/** '=', '+', '-', '@'로 시작하는 입력이 시트에서 수식으로 실행되지 않도록 */
function guardFormula_(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value;
}

/** 텍스트 서식 셀에서는 붙인 '가 값에 남을 수 있어 읽을 때 제거 */
function unguardFormula_(value) {
  return String(value).replace(/^'(?=[=+\-@])/, '');
}

function toIso_(v) {
  return v instanceof Date ? v.toISOString() : String(v || '');
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) fail_('요청이 많습니다. 잠시 후 다시 시도해 주세요.');
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** 사용자에게 그대로 보여줄 오류 */
function fail_(message) {
  const err = new Error(message);
  err.userFacing = true;
  throw err;
}

function respond_(fn) {
  let out;
  try {
    out = { ok: true, data: fn() };
  } catch (err) {
    console.error(err);
    out = { ok: false, error: err.userFacing ? err.message : '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   처음 한 번 실행: 방명록 스프레드시트 생성 + 설정 확인
   ========================================================= */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!SpreadsheetApp.getActiveSpreadsheet() && !props.getProperty('GUESTBOOK_SHEET_ID')) {
    const ss = SpreadsheetApp.create('서태평 ♥ 박규민 청첩장 방명록');
    props.setProperty('GUESTBOOK_SHEET_ID', ss.getId());
  }
  const sheet = getSheet_();
  Logger.log('방명록 시트: ' + sheet.getParent().getUrl());
  Logger.log('ACCOUNTS 설정됨: ' + Boolean(props.getProperty('ACCOUNTS')));
  Logger.log('ACCESS_KEY 설정됨: ' + Boolean(props.getProperty('ACCESS_KEY')));
}
