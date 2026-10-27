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
    father: '서석훈', // 혼주 이름 (비우면 표시 안 함)
    mother: '이성숙',
    relation: '장남',
  },
  bride: {
    name: '박규민',
    phone: '',
    father: '박동철',
    mother: '정혜옥',
    relation: '차녀',
  },

  // 예식 일시 (한국 시간)
  wedding: { year: 2027, month: 1, day: 16, hour: 13, minute: 10 },
  // 예식 달의 공휴일 (달력에 빨간 날로 표시). 1월 1일 신정
  holidays: [1],

  greeting: [
    '10년을 함께해도',
    '여전히 함께하고 싶은 사람을 만났습니다.',
    '',
    '이제 연인으로 보낸 시간보다',
    '부부로 살아갈 날들을',
    '더 많이 만들어가려 합니다.',
    '',
    '저희의 첫걸음을 함께 축복해주세요.',
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
    hall: '7층 엘리나 홀',
    address: '인천 미추홀구 주안로 103-18',
    tel: '032-437-9999',
    lat: 37.4645571,
    lng: 126.6815503,
    // 지도 앱 장소 페이지 (PC나 앱이 없을 때 열림)
    naverPlaceUrl: 'https://map.naver.com/p/entry/place/33666423',
    kakaoPlaceUrl: 'https://map.kakao.com/link/map/621225302',
    // 교통 안내: lines 한 줄 = 화면의 한 줄
    transport: [
      {
        title: '지하철',
        lines: [
          '1호선 주안역 하차 → 지하상가 2번 출구, 지상 1번 출구 도보 1분',
          '인천지하철 2호선 주안역 → 5번 출구 도보 1분',
        ],
      },
      {
        title: '버스 (주안역 앞 하차)',
        lines: [
          '일반버스 3, 5, 5-1, 6, 6-1, 38, 41, 63, 65, 65-1, 70',
          '마을버스 511, 514, 514-1, 515, 516, 518, 522, 523',
        ],
      },
      {
        title: '승용차',
        lines: [
          '제1경인고속도로: 도화IC → 도화사거리 우회전(200m) → 주안역',
          '(주안역 직진 → 식약청 유턴 → 다시 주안역)',
          '제2경인고속도로: 남동IC 지나 문학IC로 나옴 → 시민공원 → 주안역',
          '(주안역 삼거리 우회전 → 식약청 유턴 → 다시 주안역)',
        ],
      },
      {
        title: '주차',
        lines: [
          '건물 내 지하 1층 ~ 지상 6층 주차장',
          '주차장 이용 시 1시간 30분 무료',
        ],
      },
    ],
  },

  // Google Apps Script 웹앱 URL — 계좌 정보 + 방명록(구글 스프레드시트) 공용
  // 비우면 데모 모드 (계좌는 가짜, 방명록은 이 기기에만 저장)
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbyhtyUGp0bpzKBd0Ma1xu-l9nvMC-ytNFpU6F7mwr2X1ERQXoQ1S2csckUCNAnPap58/exec',

  // 카카오맵 '지도 퍼가기' 값 (키 발급 불필요). 카카오맵 > 장소 > 공유 > 지도 퍼가기 코드의 timestamp, key
  // 비우면 아래 kakaoJsKey 지도 → 구글 지도 순으로 대체
  kakaoRoughmap: { timestamp: '1791290753058', key: '2t4pdxf46pq' },

  // 카카오 JavaScript 키: 지도 + 카카오내비 + 카카오톡 공유
  // 비우면 지도는 구글 지도, 카카오내비는 카카오맵 길찾기, 공유는 기기 공유창/링크 복사로 대체
  kakaoJsKey: '',

  // 카카오톡 공유 카드 (image는 https로 시작하는 절대 주소여야 함)
  share: {
    title: '서태평 ♥ 박규민 결혼합니다',
    description: '2027년 1월 16일 토요일 오후 1시 10분 · 그랜드하우스 웨딩홀 7층 엘리나 홀',
    image: 'https://picsum.photos/seed/wedding-main/800/400',
  },

  // 페이지 맨 아래 문구
  copyright: '© 2026 Taepyeong ♥ Gyumin',

  music: {
    src: 'assets/music/bgm.mp3',
    volume: 0.4,
  },
};
