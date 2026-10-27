/**
 * 청첩장 설정 파일 — 화면에 표시되는 정보는 대부분 여기서만 수정하면 됩니다.
 *
 * ⚠️ 이 파일은 공개 저장소에 그대로 올라갑니다.
 *    - 계좌번호/예금주는 절대 넣지 말 것 → Google Apps Script 스크립트 속성(ACCOUNTS)에 저장
 *    - 전화번호도 공개됩니다. 원치 않으면 비워두세요 (비우면 전화/문자 버튼이 숨겨짐)
 */
export const CONFIG = {
  groom: {
    name: '서태평',
    phone: '', // 예: '010-0000-0000'
    father: '', // 혼주 이름 (비우면 표시 안 함)
    mother: '',
    relation: '아들', // 예: '장남', '차남'
  },
  bride: {
    name: '박규민',
    phone: '',
    father: '',
    mother: '',
    relation: '딸', // 예: '장녀', '차녀'
  },

  // 예식 일시 (한국 시간)
  wedding: { year: 2027, month: 1, day: 16, hour: 12, minute: 30 },

  greeting: [
    '서로 다른 길을 걸어온 두 사람이',
    '이제 같은 길을 함께 걸어가려 합니다.',
    '',
    '저희 두 사람의 새로운 시작을',
    '가까이에서 축복해 주시면',
    '더없는 기쁨으로 간직하겠습니다.',
  ],

  // 메인 사진 (세로 3:4 권장. assets/images/main.jpg 등으로 교체)
  mainPhoto: 'https://picsum.photos/seed/wedding-main/900/1200',

  // 사진첩: thumb = 썸네일/슬라이더용, full = 확대용
  gallery: Array.from({ length: 10 }, (_, i) => ({
    thumb: `https://picsum.photos/seed/wedding-${i + 1}/600/800`,
    full: `https://picsum.photos/seed/wedding-${i + 1}/1200/1600`,
    alt: `웨딩 사진 ${i + 1}`,
  })),

  venue: {
    name: '그랜드하우스 웨딩홀',
    hall: '7층',
    address: '인천 미추홀구 주안로 103-18',
    tel: '', // 예: '032-000-0000'
    // TODO: 정확한 좌표로 교체 (카카오 키가 있으면 주소로 자동 보정됨)
    lat: 37.4649,
    lng: 126.6800,
    transport: [
      { title: '지하철', body: '1호선 · 인천2호선 주안역 하차 (출구/도보 시간 확인 후 수정)' },
      { title: '버스', body: '주안역 정류장 하차 (노선 확인 후 수정)' },
      { title: '주차', body: '웨딩홀 주차장 이용 가능 (무료 주차 시간 확인 후 수정)' },
    ],
  },

  // 계좌 정보: Google Apps Script 웹앱 URL (비우면 데모 계좌 표시)
  accountsApiUrl: '',

  // 방명록: Supabase 프로젝트 (비우면 이 기기에만 저장되는 데모 모드)
  // anon key는 공개되어도 되는 키입니다. 보안은 supabase/schema.sql의 RLS + RPC 함수가 담당합니다.
  supabase: {
    url: '', // 예: 'https://xxxx.supabase.co'
    anonKey: '',
  },

  // 카카오 JavaScript 키: 지도 + 카카오내비 + 카카오톡 공유
  // 비우면 지도는 구글 지도, 카카오내비는 카카오맵 길찾기, 공유는 기기 공유창/링크 복사로 대체
  kakaoJsKey: '',

  // 카카오톡 공유 카드 (image는 https로 시작하는 절대 주소여야 함)
  share: {
    title: '서태평 ♥ 박규민 결혼합니다',
    description: '2027년 1월 16일 토요일 오후 12시 30분 · 그랜드하우스 웨딩홀',
    image: 'https://picsum.photos/seed/wedding-main/800/400',
  },

  // 페이지 맨 아래 문구
  copyright: '© 2026 Taepyeong ♥ Gyumin',

  music: {
    src: 'assets/music/bgm.mp3',
    volume: 0.4,
  },
};
