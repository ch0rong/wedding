# 서태평 ♥ 박규민 모바일 청첩장

세로 스크롤 한 페이지짜리 모바일 청첩장입니다. 빌드 과정 없이 HTML/CSS/바닐라 JS(ES Modules)만 써서 GitHub Pages에 그대로 올리면 됩니다.

```
index.html                  페이지 뼈대 (섹션 8개 + 음악 버튼 + 토스트/모달/라이트박스)
css/style.css               전체 스타일 (상단 :root 변수에서 색/폰트 조정)
js/
  config.js                 ★ 이름, 날짜, 장소, 사진, 연락처, API 키 등 모든 설정
  app.js                    섹션 초기화 (지도·계좌·방명록은 화면 근처에 왔을 때 로드)
  api/accounts.js           계좌 정보 (Google Apps Script)
  api/guestbook.js          방명록 (Supabase RPC)
  api/mock.js               설정 전 로컬 확인용 데모 데이터
  components/
    hero.js                 1. 메인 사진 + 손글씨 텍스트 프레임
    greeting.js             2. 모시는 글, 혼주, 전화/문자 버튼
    calendar.js             3. 달력 + D-Day
    map.js                  4. 오시는 길 (지도, 네이버/카카오내비/티맵)
    gallery.js              5. 사진첩 (carousel.js, lightbox.js 사용)
    account.js              6. 마음 전하실 곳 (아코디언)
    guestbook.js            7. 방명록
    footer.js               8. 카카오톡 공유, 링크 복사, © 문구
    music.js                배경음악 토글
  utils/                    dom, date, swipe, modal, kakao
gas/Code.gs                 계좌 정보 API (Google Apps Script)
supabase/schema.sql         방명록 테이블 + 보안 함수 (Supabase)
start.bat                   로컬 미리보기 실행
```

## 1. 로컬에서 미리보기

`index.html`을 더블클릭하면 브라우저 보안 정책 때문에 화면이 나오지 않습니다. **`start.bat`** 을 더블클릭하세요. (또는 `python -m http.server 8000`)

설정 전에는 **데모 모드**로 동작합니다. 계좌는 가짜 데이터, 방명록은 이 브라우저에만 저장됩니다.

## 2. 방명록 — Supabase

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor** → `supabase/schema.sql` 전체 붙여넣기 → **Run**
3. **Project Settings → API** 에서 `Project URL`과 `anon public` 키를 복사해 `config.js`의 `supabase.url`, `supabase.anonKey`에 입력

### 보안 구조
- anon 키는 원래 공개용 키라 저장소에 올라가도 괜찮습니다.
- 테이블은 RLS로 잠겨 있어서 브라우저가 직접 읽거나 쓸 수 없습니다. 모든 작업은 `guestbook_list / create / update / delete` RPC 함수로만 합니다.
- 비밀번호는 bcrypt 해시로만 저장되고, 함수 밖으로 해시가 나가지 않습니다.
- 같은 글에 비밀번호를 5번 틀리면 10분 동안 수정·삭제가 잠깁니다.
- 글 관리(스팸 삭제 등)는 Supabase 대시보드 **Table Editor → guestbook** 에서 직접 하면 됩니다.

## 3. 계좌 정보 — Google Apps Script

1. [script.google.com](https://script.google.com) → 새 프로젝트 → `gas/Code.gs` 내용 붙여넣기
2. **프로젝트 설정(⚙) → 스크립트 속성** 추가
   | 속성 | 값 |
   |---|---|
   | `ACCOUNTS` | 아래 형식의 JSON (한 줄) |
   | `ACCESS_KEY` | (선택) 아무 문자열. 설정하면 `?key=값`이 붙은 링크에서만 계좌가 보임 |

   ```json
   {"groom":[{"role":"신랑","name":"서태평","bank":"OO은행","number":"000-0000-0000","kakaopay":""},{"role":"아버지","name":"","bank":"","number":""}],"bride":[{"role":"신부","name":"박규민","bank":"","number":""}]}
   ```
3. `checkSetup` 함수 선택 → ▶ 실행 → 권한 승인 (로그에 계좌가 보이면 정상)
4. **배포 → 새 배포 → 웹 앱** (실행 계정: 나 / 액세스: 모든 사용자)
5. 발급된 `.../exec` URL을 `config.js`의 `accountsApiUrl`에 입력

> 계좌는 저장소 어디에도 없어서 공개 소스를 봐서는 알 수 없습니다. 다만 청첩장을 연 사람은 화면에서 볼 수 있습니다(당연히 보여 주려는 정보이므로). `ACCESS_KEY`를 쓰면 `?key=` 링크를 받은 사람만 볼 수 있습니다.

## 4. 카카오 (지도 · 카카오내비 · 카카오톡 공유) — 선택

키가 없어도 동작합니다. 지도는 구글 지도, 카카오내비는 카카오맵 길찾기, 공유는 기기 공유창/링크 복사로 대신 열립니다.

1. [Kakao Developers](https://developers.kakao.com) → 애플리케이션 생성
2. **플랫폼 → Web** 에 사이트 도메인 등록 (`https://아이디.github.io`, 로컬용 `http://localhost:8000`)
3. **카카오맵** 사용 설정 ON
4. **JavaScript 키** → `config.js`의 `kakaoJsKey`
   - JavaScript 키는 등록한 도메인에서만 동작하므로 공개되어도 괜찮습니다.

## 5. GitHub Pages 배포

1. 이 폴더를 GitHub 저장소에 push
2. **Settings → Pages → Deploy from a branch → main / (root)**
3. `https://아이디.github.io/저장소명/` 으로 접속

## 6. 교체할 것 체크리스트
- [ ] `config.js`: 혼주 이름, 연락처(공개됨 주의), 홀 전화번호, 정확한 좌표, 교통 안내
- [ ] `config.js`: `mainPhoto`, `gallery` → 실제 사진 (`assets/images/`에 넣고 경로 지정)
- [ ] `config.js`: `share.image` → 카카오톡 공유 카드 사진 (https 절대 주소)
- [ ] `index.html`: `og:*` 메타 태그 (카톡 링크 미리보기는 JS가 실행되지 않으므로 직접 수정)
- [ ] Supabase URL/키, Apps Script URL, 카카오 키
